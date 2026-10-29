#!/usr/bin/env python3
"""Сборка APK без Android SDK: AXML-манифест + DEX (WebView-оболочка) + ZIP + подпись v1/v2.

Запуск из корня проекта:  python3 tools/build_apk.py
Результат: dist/Epicenter-demo.apk, dist/Epicenter-demo-noicon.apk, dist/Epicenter-demo-safe.apk
Нужны: Python 3.9+, пакет cryptography (pip install cryptography).
"""
import struct, zlib, hashlib, base64, os, io, zipfile, datetime, sys
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.serialization import pkcs7

PKG = 'com.epicenter.game'
ACT = PKG + '.MainActivity'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, 'game')
DIST = os.path.join(ROOT, 'dist')
BUILD = os.path.join(ROOT, 'build')
SIGN = os.path.join(ROOT, 'signing')
OUT = os.path.join(DIST, 'Epicenter-demo.apk')
U32 = lambda v: struct.pack('<I', v & 0xFFFFFFFF)
U16 = lambda v: struct.pack('<H', v & 0xFFFF)
U64 = lambda v: struct.pack('<Q', v)

# ------------------------------------------------------------------ AXML
RES = {'theme': 0x01010000, 'label': 0x01010001, 'name': 0x01010003, 'exported': 0x01010010,
       'screenOrientation': 0x0101001e, 'configChanges': 0x0101001f, 'minSdkVersion': 0x0101020c,
       'versionCode': 0x0101021b, 'versionName': 0x0101021c, 'targetSdkVersion': 0x01010270,
       'allowBackup': 0x01010280, 'hardwareAccelerated': 0x010102d3, 'icon': 0x01010002, 'drawable': 0x01010199}
NS_URI = 'http://schemas.android.com/apk/res/android'
NIL = 0xFFFFFFFF

def A(name, kind, val, ns=True):
    return (ns, name, kind, val)

def build_axml(icon=False, tree=None):
    mtree = ('manifest', [A('package', 's', PKG, ns=False), A('versionCode', 'i', 13), A('versionName', 's', '0.10.0-demo')], [
        ('uses-permission', [A('name', 's', 'android.permission.VIBRATE')], []),
        ('uses-sdk', [A('minSdkVersion', 'i', 21), A('targetSdkVersion', 'i', 33)], []),
        ('application', [A('theme', 'r', 0x01030007), A('label', 's', 'Эпицентр'), A('allowBackup', 'b', False), A('hardwareAccelerated', 'b', True)] + ([A('icon', 'r', 0x7f010000)] if icon else []), [
            ('activity', [A('label', 's', 'Эпицентр'), A('name', 's', ACT), A('exported', 'b', True),
                          A('screenOrientation', 'i', 6), A('configChanges', 'x', 0x0FA0)], [
                ('intent-filter', [], [
                    ('action', [A('name', 's', 'android.intent.action.MAIN')], []),
                    ('category', [A('name', 's', 'android.intent.category.LAUNCHER')], [])])])])])
    if tree is None: tree = mtree
    # string pool: сначала имена атрибутов с resource id (по возрастанию id), затем прочее
    attr_names = sorted(RES, key=lambda n: RES[n])
    strings = list(attr_names)
    def S(s):
        if s not in strings: strings.append(s)
        return strings.index(s)
    S('android'); S(NS_URI); S('package')
    def collect(n):
        S(n[0])
        for ns, nm, kind, v in n[1]:
            S(nm)
            if kind == 's': S(v)
        for c in n[2]: collect(c)
    collect(tree)
    ns_prefix, ns_uri = S('android'), S(NS_URI)

    def chunk(t, hdr, body):  # hdr: extra header bytes after the 8-byte chunk header
        size = 8 + len(hdr) + len(body)
        return U16(t) + U16(8 + len(hdr)) + U32(size) + hdr + body

    # string pool
    data = b''; offs = []
    for s in strings:
        offs.append(len(data)); enc = s.encode('utf-16-le')
        data += U16(len(s)) + enc + U16(0)
    while len(data) % 4: data += b'\0'
    sp_hdr = U32(len(strings)) + U32(0) + U32(0) + U32(28 + 4 * len(strings)) + U32(0)
    sp = chunk(0x0001, sp_hdr, b''.join(U32(o) for o in offs) + data)
    rmap = chunk(0x0180, b'', b''.join(U32(RES[n]) for n in attr_names))

    line = [1]
    def start_el(n):
        attrs = sorted(n[1], key=lambda a: (RES.get(a[1], 0) if a[0] else 0, a[1]))
        body = b''
        for ns, nm, kind, v in attrs:
            nsi = ns_uri if ns else NIL
            if kind == 's':   raw, typ, dat = S(v), 0x03, S(v)
            elif kind == 'i': raw, typ, dat = NIL, 0x10, v
            elif kind == 'x': raw, typ, dat = NIL, 0x11, v
            elif kind == 'b': raw, typ, dat = NIL, 0x12, (NIL if v else 0)
            elif kind == 'r': raw, typ, dat = NIL, 0x01, v
            body += U32(nsi) + U32(S(nm)) + U32(raw) + U16(8) + b'\0' + bytes([typ]) + U32(dat)
        hdr = U32(line[0]) + U32(NIL)
        ext = U32(NIL) + U32(S(n[0])) + U16(0x14) + U16(0x14) + U16(len(attrs)) + U16(0) + U16(0) + U16(0)
        line[0] += 1
        return U16(0x0102) + U16(16) + U32(16 + len(ext) + len(body)) + hdr + ext + body
    def end_el(n):
        c = U16(0x0103) + U16(16) + U32(24) + U32(line[0]) + U32(NIL) + U32(NIL) + U32(S(n[0]))
        line[0] += 1; return c
    def walk(n):
        out = start_el(n)
        for c in n[2]: out += walk(c)
        return out + end_el(n)
    body_els = walk(tree)
    start_ns = U16(0x0100) + U16(16) + U32(24) + U32(1) + U32(NIL) + U32(ns_prefix) + U32(ns_uri)
    end_ns = U16(0x0101) + U16(16) + U32(24) + U32(line[0]) + U32(NIL) + U32(ns_prefix) + U32(ns_uri)
    inner = sp + rmap + start_ns + body_els + end_ns
    return U16(0x0003) + U16(8) + U32(8 + len(inner)) + inner

# ------------------------------------------------------------------ DEX
def uleb(v):
    out = bytearray()
    while True:
        b = v & 0x7F; v >>= 7
        if v: out.append(b | 0x80)
        else: out.append(b); return bytes(out)

def build_dex(full=True):
    CLS = 'L' + ACT.replace('.', '/') + ';'
    T_ACT, T_BUN, T_WV, T_WS, T_CTX, T_VIEW, T_WIN, T_STR = ('Landroid/app/Activity;', 'Landroid/os/Bundle;', 'Landroid/webkit/WebView;',
        'Landroid/webkit/WebSettings;', 'Landroid/content/Context;', 'Landroid/view/View;', 'Landroid/view/Window;', 'Ljava/lang/String;')
    T_BV, T_LP = 'Landroid/os/Build$VERSION;', 'Landroid/view/WindowManager$LayoutParams;'
    types = {CLS, T_ACT, T_BUN, T_WV, T_WS, T_CTX, T_VIEW, T_WIN, T_STR, 'V', 'Z', 'I'}
    if full: types |= {T_BV, T_LP}
    PR = {  # имя -> (return, params)
        'v_': ('V', ()), 'v_bun': ('V', (T_BUN,)), 'v_ctx': ('V', (T_CTX,)), 'ws_': (T_WS, ()), 'v_z': ('V', ('Z',)),
        'v_str': ('V', (T_STR,)), 'v_view': ('V', (T_VIEW,)), 'v_i': ('V', ('I',)), 'win_': (T_WIN, ()), 'view_': (T_VIEW, ())}
    if full: PR.update({'lp_': (T_LP, ()), 'v_lp': ('V', (T_LP,))})
    def shorty(r, ps): return ('L' if r[0] in 'L[' else r) + ''.join('L' if p[0] in 'L[' else p for p in ps)
    MT = {  # ключ -> (class, name, proto)
        'm_init': (CLS, '<init>', 'v_'), 'm_onCreate': (CLS, 'onCreate', 'v_bun'),
        'a_init': (T_ACT, '<init>', 'v_'), 'a_onCreate': (T_ACT, 'onCreate', 'v_bun'), 'a_setContent': (T_ACT, 'setContentView', 'v_view'),
        'a_getWindow': (T_ACT, 'getWindow', 'win_'),
        'wv_init': (T_WV, '<init>', 'v_ctx'), 'wv_getSettings': (T_WV, 'getSettings', 'ws_'), 'wv_loadUrl': (T_WV, 'loadUrl', 'v_str'),
        'wv_setBg': (T_WV, 'setBackgroundColor', 'v_i'),
        'ws_js': (T_WS, 'setJavaScriptEnabled', 'v_z'), 'ws_file': (T_WS, 'setAllowFileAccess', 'v_z'), 'ws_dom': (T_WS, 'setDomStorageEnabled', 'v_z'),
        'win_deco': (T_WIN, 'getDecorView', 'view_'), 'win_flags': (T_WIN, 'addFlags', 'v_i'), 'view_sysui': (T_VIEW, 'setSystemUiVisibility', 'v_i')}
    FT = {}   # ключ -> (class, name, type)
    if full:
        MT.update({'ws_zoom': (T_WS, 'setTextZoom', 'v_i'), 'win_getAttrs': (T_WIN, 'getAttributes', 'lp_'), 'win_setAttrs': (T_WIN, 'setAttributes', 'v_lp')})
        FT.update({'f_sdk': (T_BV, 'SDK_INT', 'I'), 'f_cut': (T_LP, 'layoutInDisplayCutoutMode', 'I')})
    URL = 'file:///android_asset/index.html'
    strs = set(types) | {'<init>', 'onCreate', 'setContentView', 'getWindow', 'loadUrl', 'setBackgroundColor', 'setJavaScriptEnabled',
                         'setAllowFileAccess', 'getDecorView', 'addFlags', 'setSystemUiVisibility', URL}
    for r, ps in PR.values(): strs.add(shorty(r, ps))
    for c, n, p in MT.values(): strs.add(n)
    for c, n, t in FT.values(): strs.add(n)
    strings = sorted(strs, key=lambda s: s.encode('utf-8'))
    sid = {s: i for i, s in enumerate(strings)}
    tlist = sorted(types, key=lambda t: sid[t]); tid = {t: i for i, t in enumerate(tlist)}
    protos = sorted(PR, key=lambda k: (tid[PR[k][0]], tuple(tid[p] for p in PR[k][1])))
    pid = {k: i for i, k in enumerate(protos)}
    meths = sorted(MT, key=lambda k: (tid[MT[k][0]], sid[MT[k][1]], pid[MT[k][2]]))
    mid = {k: i for i, k in enumerate(meths)}
    fields = sorted(FT, key=lambda k: (tid[FT[k][0]], sid[FT[k][1]], tid[FT[k][2]]))
    fid = {k: i for i, k in enumerate(fields)}

    # --- bytecode
    def i35(op, regs, m):
        a = len(regs); r = list(regs) + [0] * 5
        return [(a << 12) | (r[4] << 8) | op, mid[m], (r[3] << 12) | (r[2] << 8) | (r[1] << 4) | r[0]]
    INV_V, INV_S, INV_D = 0x6e, 0x6f, 0x70
    v0, v1, v2, v3, p0, p1 = 0, 1, 2, 3, 4, 5
    code = []
    code += i35(INV_S, [p0, p1], 'a_onCreate')
    code += [(v0 << 8) | 0x22, tid[T_WV]]
    code += i35(INV_D, [v0, p0], 'wv_init')
    code += i35(INV_V, [v0], 'wv_getSettings'); code += [(v1 << 8) | 0x0c]
    code += [(1 << 12) | (v2 << 8) | 0x12]                          # const/4 v2, 1
    code += i35(INV_V, [v1, v2], 'ws_js') + i35(INV_V, [v1, v2], 'ws_file')
    code += i35(INV_V, [v1, v2], 'ws_dom')                            # setDomStorageEnabled(true): без него localStorage в WebView не работает и прогресс не сохраняется
    if full:
        code += [(v3 << 8) | 0x13, 100]                                 # const/16 v3, 100
        code += i35(INV_V, [v1, v3], 'ws_zoom')                         # setTextZoom(100): системный размер шрифта не ломает вёрстку
    col = 0xFF0B1118
    code += [(v3 << 8) | 0x14, col & 0xFFFF, col >> 16]             # const v3, 0xff0b1118
    code += i35(INV_V, [v0, v3], 'wv_setBg')
    code += [(v3 << 8) | 0x1a, sid[URL]]                            # const-string v3, URL
    code += i35(INV_V, [v0, v3], 'wv_loadUrl')
    code += i35(INV_V, [p0, v0], 'a_setContent')
    code += i35(INV_V, [p0], 'a_getWindow'); code += [(v1 << 8) | 0x0c]
    code += [(v2 << 8) | 0x13, 0x0080]                              # const/16 v2, FLAG_KEEP_SCREEN_ON
    code += i35(INV_V, [v1, v2], 'win_flags')
    if full:   # if (Build.VERSION.SDK_INT >= 28) { lp = window.getAttributes(); lp.layoutInDisplayCutoutMode = 1; window.setAttributes(lp); }
        code += [(v2 << 8) | 0x60, fid['f_sdk']]                        # sget v2, Build$VERSION.SDK_INT
        code += [(v3 << 8) | 0x13, 28]                                  # const/16 v3, 28
        code += [(v3 << 12) | (v2 << 8) | 0x34, 12]                     # if-lt v2, v3, +12 (после блока)
        code += i35(INV_V, [v1], 'win_getAttrs'); code += [(v2 << 8) | 0x0c]
        code += [(1 << 12) | (v3 << 8) | 0x12]                          # const/4 v3, 1  (SHORT_EDGES)
        code += [(v2 << 12) | (v3 << 8) | 0x59, fid['f_cut']]           # iput v3, v2, LayoutParams.layoutInDisplayCutoutMode
        code += i35(INV_V, [v1, v2], 'win_setAttrs')
    code += i35(INV_V, [v1], 'win_deco'); code += [(v1 << 8) | 0x0c]
    code += [(v2 << 8) | 0x13, 0x1706]                              # immersive sticky | hide nav | fullscreen | layout flags
    code += i35(INV_V, [v1, v2], 'view_sysui')
    code += [0x000e]
    def code_item(regs, ins, outs, insns):
        return struct.pack('<HHHHII', regs, ins, outs, 0, 0, len(insns)) + b''.join(U16(u) for u in insns)
    ci_create = code_item(6, 2, 2, code)
    ci_init = code_item(1, 1, 1, i35(INV_D, [0], 'a_init') + [0x000e])

    # --- layout
    nS, nT, nP, nM, nF = len(strings), len(tlist), len(protos), len(meths), len(fields)
    off = 0x70
    o_str = off; off += 4 * nS
    o_typ = off; off += 4 * nT
    o_pro = off; off += 12 * nP
    o_fld = off; off += 8 * nF
    o_met = off; off += 8 * nM
    o_cls = off; off += 32
    data_off = off
    data = bytearray()
    def align(n=4):
        while (data_off + len(data)) % n: data.append(0)
    str_offs = []
    for s in strings:
        str_offs.append(data_off + len(data)); b = s.encode('utf-8')
        data += uleb(len(s)) + b + b'\0'
    string_data_end = len(data)
    align(); tl_start = data_off + len(data); tl_off = {}; tl_cnt = 0
    for k in protos:
        ps = PR[k][1]
        if ps and ps not in tl_off:
            align(); tl_off[ps] = data_off + len(data); tl_cnt += 1
            data += U32(len(ps)) + b''.join(U16(tid[p]) for p in ps)
    align(); code_start = data_off + len(data)
    align(); o_ci_create = data_off + len(data); data += ci_create
    align(); o_ci_init = data_off + len(data); data += ci_init
    cd_start = data_off + len(data)
    cdata = bytearray()
    cdata += uleb(0) + uleb(0) + uleb(1) + uleb(1)
    cdata += uleb(mid['m_init']) + uleb(0x10001) + uleb(o_ci_init)        # direct: public constructor
    cdata += uleb(mid['m_onCreate']) + uleb(0x0004) + uleb(o_ci_create)   # virtual: protected onCreate
    o_cdata = data_off + len(data); data += cdata
    align(); o_map = data_off + len(data)
    maps = [(0x0000, 1, 0), (0x0001, nS, o_str), (0x0002, nT, o_typ), (0x0003, nP, o_pro)] + ([(0x0004, nF, o_fld)] if nF else []) + [(0x0005, nM, o_met), (0x0006, 1, o_cls),
            (0x2002, nS, str_offs[0]), (0x1001, tl_cnt, tl_start), (0x2001, 2, o_ci_create if o_ci_create < o_ci_init else o_ci_init),
            (0x2000, 1, o_cdata), (0x1000, 1, o_map)]
    data += U32(len(maps)) + b''.join(U16(t) + U16(0) + U32(c) + U32(o) for t, c, o in maps)
    while len(data) % 4: data.append(0)
    file_size = data_off + len(data)

    body = bytearray()
    for o in str_offs: body += U32(o)
    for t in tlist: body += U32(sid[t])
    for k in protos:
        r, ps = PR[k]; body += U32(sid[shorty(r, ps)]) + U32(tid[r]) + U32(tl_off.get(ps, 0))
    for k in fields:
        c, n, t = FT[k]; body += U16(tid[c]) + U16(tid[t]) + U32(sid[n])
    for k in meths:
        c, n, p = MT[k]; body += U16(tid[c]) + U16(pid[p]) + U32(sid[n])
    body += U32(tid[CLS]) + U32(0x1) + U32(tid[T_ACT]) + U32(0) + U32(NIL) + U32(0) + U32(o_cdata) + U32(0)
    hdr_tail = (U32(file_size) + U32(0x70) + U32(0x12345678) + U32(0) + U32(0) + U32(o_map) +
                U32(nS) + U32(o_str) + U32(nT) + U32(o_typ) + U32(nP) + U32(o_pro) + U32(nF) + U32(o_fld if nF else 0) + U32(nM) + U32(o_met) +
                U32(1) + U32(o_cls) + U32(file_size - data_off) + U32(data_off))
    rest = hdr_tail + bytes(body) + bytes(data)
    sig = hashlib.sha1(rest).digest()                      # sha1 по всему после поля signature
    chk = zlib.adler32(sig + rest) & 0xFFFFFFFF            # adler32 по всему после поля checksum
    return b'dex\n035\0' + U32(chk) + sig + rest

# ------------------------------------------------------------------ ключ и сертификат
def make_key():
    """Постоянный ключ подписи: создаётся один раз в signing/ и дальше используется всеми сборками,
    чтобы новые версии ставились поверх старых. Это демо-ключ — для публикации в магазине нужен свой."""
    kp, cp = os.path.join(SIGN, 'epicenter-demo-key.pem'), os.path.join(SIGN, 'epicenter-demo-cert.pem')
    if os.path.exists(kp) and os.path.exists(cp):
        key = serialization.load_pem_private_key(open(kp, 'rb').read(), password=None)
        cert = x509.load_pem_x509_certificate(open(cp, 'rb').read())
        return key, cert
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, 'Epicenter Demo'), x509.NameAttribute(NameOID.ORGANIZATION_NAME, 'Epicenter')])
    now = datetime.datetime(2026, 10, 19)
    cert = (x509.CertificateBuilder().subject_name(name).issuer_name(name).public_key(key.public_key())
            .serial_number(x509.random_serial_number()).not_valid_before(now).not_valid_after(now + datetime.timedelta(days=365 * 30))
            .sign(key, hashes.SHA256()))
    os.makedirs(SIGN, exist_ok=True)
    open(kp, 'wb').write(key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()))
    open(cp, 'wb').write(cert.public_bytes(serialization.Encoding.PEM))
    print('Создан новый ключ подписи в', SIGN)
    return key, cert

# ------------------------------------------------------------------ ZIP + v1
def build_zip(files):
    names = list(files)
    mf = b'Manifest-Version: 1.0\r\nCreated-By: epicenter-build\r\n\r\n'
    sections = {}
    for n in names:
        d = base64.b64encode(hashlib.sha256(files[n]).digest()).decode()
        sections[n] = f'Name: {n}\r\nSHA-256-Digest: {d}\r\n\r\n'.encode()
        mf += sections[n]
    sf = (b'Signature-Version: 1.0\r\nCreated-By: epicenter-build\r\nSHA-256-Digest-Manifest: ' +
          base64.b64encode(hashlib.sha256(mf).digest()) + b'\r\nX-Android-APK-Signed: 2\r\n\r\n')
    for n in names:
        sf += f'Name: {n}\r\nSHA-256-Digest: '.encode() + base64.b64encode(hashlib.sha256(sections[n]).digest()) + b'\r\n\r\n'
    return mf, sf

def write_zip(entries):
    bio = io.BytesIO()
    with zipfile.ZipFile(bio, 'w') as z:
        for n, (data, comp) in entries.items():
            zi = zipfile.ZipInfo(n, (2026, 10, 19, 0, 0, 0)); zi.compress_type = comp; zi.external_attr = 0o644 << 16
            z.writestr(zi, data)
    return bio.getvalue()

# ------------------------------------------------------------------ v2
def lp(b): return U32(len(b)) + b

def sign_v2(apk, key, cert):
    eocd_pos = apk.rfind(b'PK\x05\x06')
    cd_off = struct.unpack('<I', apk[eocd_pos + 16:eocd_pos + 20])[0]
    s1, s3, s4 = apk[:cd_off], apk[cd_off:eocd_pos], apk[eocd_pos:]
    assert len(s4) == 22
    digs = []
    for sec in (s1, s3, s4):
        for i in range(0, len(sec), 1 << 20):
            ch = sec[i:i + (1 << 20)]; digs.append(hashlib.sha256(b'\xa5' + U32(len(ch)) + ch).digest())
    top = hashlib.sha256(b'\x5a' + U32(len(digs)) + b''.join(digs)).digest()
    cert_der = cert.public_bytes(serialization.Encoding.DER)
    spki = key.public_key().public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo)
    ALGO = 0x0103
    digests = lp(U32(ALGO) + lp(top))
    signed = lp(digests) + lp(lp(cert_der)) + lp(b'')
    sig = key.sign(signed, padding.PKCS1v15(), hashes.SHA256())
    signer = lp(signed) + lp(lp(U32(ALGO) + lp(sig))) + lp(spki)
    value = lp(lp(signer))
    pair = U64(4 + len(value)) + U32(0x7109871a) + value
    blk_size = len(pair) + 8 + 16
    block = U64(blk_size) + pair + U64(blk_size) + b'APK Sig Block 42'
    new_eocd = s4[:16] + U32(cd_off + len(block)) + s4[20:]
    return s1 + block + s3 + new_eocd

# ------------------------------------------------------------------ ARSC (иконка)
def pool16(strings):
    data = b''; offs = []
    for t in strings:
        offs.append(len(data)); data += U16(len(t)) + t.encode('utf-16-le') + U16(0)
    while len(data) % 4: data += b'\0'
    body = b''.join(U32(o) for o in offs) + data
    return U16(0x0001) + U16(28) + U32(28 + len(body)) + U32(len(strings)) + U32(0) + U32(0) + U32(28 + 4 * len(strings)) + U32(0) + body

def rcfg(density=0, sdk=0):
    return struct.pack('<IHHHHBBHBBBBHHHHBBHHH', 36, 0, 0, 0, 0, 0, 0, density, 0, 0, 0, 0, 0, 0, sdk, 0, 0, 0, 0, 0, 0)

def type_chunk(cfg, entries, nent):
    hs = 8 + 4 + 4 + 4 + len(cfg); offs = [NIL] * nent; body = b''
    for idx, key, sidx in entries:
        offs[idx] = len(body); body += U16(8) + U16(0) + U32(key) + U16(8) + bytes([0, 3]) + U32(sidx)
    es = hs + 4 * nent
    return U16(0x0201) + U16(hs) + U32(es + len(body)) + bytes([1, 0]) + U16(0) + U32(nent) + U32(es) + cfg + b''.join(U32(o) for o in offs) + body

ICON_FILES = {'res/mipmap/' + n: os.path.join(ROOT, 'icon', n) for n in ('ic_launcher.png', 'ic_launcher_fg.png', 'ic_launcher_bg.png')}

def build_arsc():
    vals = ['res/mipmap/ic_launcher.png', 'res/mipmap/ic_launcher_fg.png', 'res/mipmap/ic_launcher_bg.png', 'res/mipmap-anydpi-v26/ic_launcher.xml']
    gpool = pool16(vals); tpool = pool16(['mipmap']); kpool = pool16(['ic_launcher', 'ic_launcher_fg', 'ic_launcher_bg'])
    ts = U16(0x0202) + U16(16) + U32(16 + 12) + bytes([1, 0]) + U16(0) + U32(3) + U32(0x400) + U32(0) + U32(0)
    t1 = type_chunk(rcfg(), [(0, 0, 0), (1, 1, 1), (2, 2, 2)], 3)
    t2 = type_chunk(rcfg(density=0xFFFE, sdk=26), [(0, 0, 3)], 3)
    name = PKG.encode('utf-16-le').ljust(256, b'\0')
    body = tpool + kpool + ts + t1 + t2
    pkg = U16(0x0200) + U16(288) + U32(288 + len(body)) + U32(0x7f) + name + U32(288) + U32(1) + U32(288 + len(tpool)) + U32(3) + U32(0) + body
    return U16(0x0002) + U16(12) + U32(12 + len(gpool) + len(pkg)) + U32(1) + gpool + pkg

def adaptive_xml():
    tree = ('adaptive-icon', [], [('background', [A('drawable', 'r', 0x7f010002)], []), ('foreground', [A('drawable', 'r', 0x7f010001)], [])])
    return build_axml(tree=tree)

# ------------------------------------------------------------------ main
def write_zip(entries):
    bio = io.BytesIO()
    with zipfile.ZipFile(bio, 'w') as z:
        for n, (data, comp) in entries.items():
            zi = zipfile.ZipInfo(n, (2026, 10, 19, 0, 0, 0)); zi.compress_type = comp; zi.external_attr = 0o644 << 16
            if n == 'resources.arsc':   # Android 11+: без сжатия и с выравниванием по 4 байта
                base = bio.tell() + 30 + len(n.encode())
                pad = (-base) % 4
                if pad: pad = pad if pad >= 4 else pad + 4
                if pad: zi.extra = struct.pack('<HH', 0xD935, pad - 4) + b'\0' * (pad - 4)
            z.writestr(zi, data)
    return bio.getvalue()

def assemble(key, cert, icon, full=True):
    files = {'AndroidManifest.xml': build_axml(icon=icon), 'classes.dex': build_dex(full)}
    if icon:
        files['resources.arsc'] = build_arsc()
        files['res/mipmap-anydpi-v26/ic_launcher.xml'] = adaptive_xml()
        for k, p in ICON_FILES.items(): files[k] = open(p, 'rb').read()
    for root, _, fs in os.walk(ASSETS):
        for f in sorted(fs):
            p = os.path.join(root, f); files['assets/' + os.path.relpath(p, ASSETS).replace(os.sep, '/')] = open(p, 'rb').read()
    mf, sf = build_zip(files)
    p7 = pkcs7.PKCS7SignatureBuilder().set_data(sf).add_signer(cert, key, hashes.SHA256()).sign(
        serialization.Encoding.DER, [pkcs7.PKCS7Options.DetachedSignature, pkcs7.PKCS7Options.Binary])
    entries = {}
    for n, d in files.items():
        stored = n.endswith('.jpg') or n.endswith('.png') or n == 'resources.arsc'
        entries[n] = (d, zipfile.ZIP_STORED if stored else zipfile.ZIP_DEFLATED)
    entries['META-INF/MANIFEST.MF'] = (mf, zipfile.ZIP_DEFLATED); entries['META-INF/CERT.SF'] = (sf, zipfile.ZIP_DEFLATED); entries['META-INF/CERT.RSA'] = (p7, zipfile.ZIP_DEFLATED)
    return sign_v2(write_zip(entries), key, cert), files

def main():
    key, cert = make_key()
    os.makedirs(DIST, exist_ok=True); os.makedirs(BUILD, exist_ok=True)
    apk, files = assemble(key, cert, True)
    open(OUT, 'wb').write(apk)
    for n, d in (('classes.dex', files['classes.dex']), ('AndroidManifest.xml.bin', files['AndroidManifest.xml']),
                 ('resources.arsc', files['resources.arsc']), ('ic_adaptive.xml.bin', files['res/mipmap-anydpi-v26/ic_launcher.xml'])):
        open(os.path.join(BUILD, n), 'wb').write(d)
    apk2, _ = assemble(key, cert, False)                 # без иконки (на случай проблем с ресурсами)
    open(os.path.join(DIST, 'Epicenter-demo-noicon.apk'), 'wb').write(apk2)
    apk3, f3 = assemble(key, cert, True, full=False)     # «безопасный»: прежняя нативная часть без setTextZoom/выреза
    open(os.path.join(DIST, 'Epicenter-demo-safe.apk'), 'wb').write(apk3)
    open(os.path.join(BUILD, 'classes_safe.dex'), 'wb').write(f3['classes.dex'])
    print('APK', OUT, len(apk), 'bytes; noicon', len(apk2), '; safe', len(apk3))

if __name__ == '__main__':
    main()
