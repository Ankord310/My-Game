#!/usr/bin/env python3
"""Независимая проверка classes.dex: структура по спецификации DEX 035 + дизассемблирование единственного метода."""
import struct, sys, zlib, hashlib, zipfile
import os
path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dist', 'Epicenter-demo.apk')
if path.endswith('.apk'):
    d = zipfile.ZipFile(path).read('classes.dex')
else:
    d = open(path, 'rb').read()
u32 = lambda o: struct.unpack_from('<I', d, o)[0]
u16 = lambda o: struct.unpack_from('<H', d, o)[0]
bad = 0
def chk(c, m):
    global bad
    print(('OK   ' if c else 'FAIL ') + m)
    if not c: bad += 1

chk(d[:8] == b'dex\n035\0', 'magic dex 035')
chk(u32(8) == (zlib.adler32(d[12:]) & 0xFFFFFFFF), 'adler32 checksum')
chk(d[12:32] == hashlib.sha1(d[32:]).digest(), 'sha1 signature')
chk(u32(32) == len(d), 'file_size == real size (%d)' % len(d))
chk(u32(36) == 0x70 and u32(40) == 0x12345678, 'header_size 0x70, little-endian tag')
(link_sz, link_off, map_off, nS, oS, nT, oT, nP, oP, nF, oF, nM, oM, nC, oC, dsz, doff) = struct.unpack_from('<17I', d, 44)
print('   counts: strings %d types %d protos %d fields %d methods %d classes %d; data %d@%d map@%d' % (nS, nT, nP, nF, nM, nC, dsz, doff, map_off))
chk(link_sz == 0 and link_off == 0, 'no link section')
oF2 = oF if nF else oP + 12 * nP   # при нуле полей заголовок хранит смещение 0
chk(oS == 0x70 and oT == oS + 4 * nS and oP == oT + 4 * nT and oF2 == oP + 12 * nP and oM == oF2 + 8 * nF and oC == oM + 8 * nM and doff == oC + 32 * nC,
    'id sections are contiguous in the required order (string, type, proto, field, method, class_def, data)')
chk(doff + dsz == len(d), 'data section ends at EOF')

def uleb(o):
    v = 0; sh = 0
    while True:
        b = d[o]; o += 1; v |= (b & 0x7F) << sh; sh += 7
        if not b & 0x80: return v, o
strs = []
for i in range(nS):
    so = u32(oS + 4 * i); L, p = uleb(so); e = d.index(b'\0', p)
    s = d[p:e].decode('utf-8'); strs.append(s)
    chk(len(s) == L, 'string[%d] utf16_size matches (%r)' if False else 'string[%d] utf16 length ok' % i) if len(s) != L else None
chk(all(strs[i] < strs[i + 1] for i in range(nS - 1)), 'string_ids sorted & unique')
types = [u32(oT + 4 * i) for i in range(nT)]
chk(all(types[i] < types[i + 1] for i in range(nT - 1)) and all(t < nS for t in types), 'type_ids sorted by string_idx & unique')
T = lambda i: strs[types[i]]
protos = []
for i in range(nP):
    sh, rt, pl = struct.unpack_from('<III', d, oP + 12 * i)
    ps = []
    if pl:
        n = u32(pl); chk(pl % 4 == 0, 'type_list %d aligned' % i); ps = [u16(pl + 4 + 2 * k) for k in range(n)]
    protos.append((sh, rt, tuple(ps)))
    desc = lambda t: 'L' if T(t)[0] in 'L[' else T(t)
    chk(strs[sh] == desc(rt) + ''.join(desc(p) for p in ps), 'proto %d shorty %r matches %s%s' % (i, strs[sh], T(rt), [T(p) for p in ps]))
chk(all((protos[i][1], protos[i][2]) < (protos[i + 1][1], protos[i + 1][2]) for i in range(nP - 1)), 'proto_ids sorted by (return, params) & unique')
fields = [struct.unpack_from('<HHI', d, oF + 8 * i) for i in range(nF)]
chk(all(fields[i][0] < fields[i + 1][0] or (fields[i][0] == fields[i + 1][0] and (fields[i][2], fields[i][1]) < (fields[i + 1][2], fields[i + 1][1])) for i in range(nF - 1)),
    'field_ids sorted by (class, name, type) & unique')
for i, (c, t, n) in enumerate(fields): print('   field %d: %s.%s : %s' % (i, T(c), strs[n], T(t)))
meths = [struct.unpack_from('<HHI', d, oM + 8 * i) for i in range(nM)]
chk(all((meths[i][0], meths[i][2], meths[i][1]) < (meths[i + 1][0], meths[i + 1][2], meths[i + 1][1]) for i in range(nM - 1)), 'method_ids sorted by (class, name, proto) & unique')
for i, (c, p, n) in enumerate(meths): print('   method %d: %s.%s %s%s' % (i, T(c), strs[n], [T(x) for x in protos[p][2]], T(protos[p][1])))
# class_def
cd = struct.unpack_from('<8I', d, oC)
print('   class_def:', T(cd[0]), 'super', T(cd[2]), 'flags %#x' % cd[1], 'class_data@%d' % cd[6])
co = cd[6]; sf, co = uleb(co); inf, co = uleb(co); dm, co = uleb(co); vm, co = uleb(co)
chk((sf, inf, dm, vm) == (0, 0, 1, 1), 'class_data: 0 static fields, 0 instance fields, 1 direct, 1 virtual')
codes = []
mi = 0
for kind, cnt in (('direct', dm), ('virtual', vm)):
    mi = 0
    for _ in range(cnt):
        diff, co = uleb(co); acc, co = uleb(co); cof, co = uleb(co); mi += diff
        codes.append((kind, mi, acc, cof))
        print('   %s method idx %d (%s.%s) access %#x code@%d' % (kind, mi, T(meths[mi][0]), strs[meths[mi][2]], acc, cof))

# ---- дизассемблер для используемого набора опкодов
def disasm(cof, mname):
    regs, ins, outs, tries, dbg, isz = struct.unpack_from('<HHHHII', d, cof)
    chk(cof % 4 == 0, '%s: code_item 4-byte aligned' % mname)
    ip = cof + 16
    u = [u16(ip + 2 * i) for i in range(isz)]
    print('   -- %s: registers=%d ins=%d outs=%d insns=%d units' % (mname, regs, ins, outs, isz))
    pc = 0; starts = set(); text = []; branch = []
    maxout = 0
    while pc < isz:
        starts.add(pc); w = u[pc]; op = w & 0xFF
        def reg_ok(*r):
            for x in r: chk(x < regs, '%s@%d: register v%d < registers_size %d' % (mname, pc, x, regs)) if x >= regs else None
        if op == 0x00 and w == 0:
            text.append('%3d nop' % pc); pc += 1
        elif op == 0x0e:
            text.append('%3d return-void' % pc); pc += 1
        elif op == 0x0c:
            a = w >> 8; reg_ok(a); text.append('%3d move-result-object v%d' % (pc, a)); pc += 1
        elif op == 0x12:
            a = (w >> 8) & 0xF; b = (w >> 12) & 0xF; reg_ok(a); text.append('%3d const/4 v%d, #%d' % (pc, a, b)); pc += 1
        elif op == 0x13:
            a = w >> 8; reg_ok(a); text.append('%3d const/16 v%d, #%d' % (pc, a, struct.unpack('<h', struct.pack('<H', u[pc + 1]))[0])); pc += 2
        elif op == 0x14:
            a = w >> 8; reg_ok(a); text.append('%3d const v%d, #%#x' % (pc, a, u[pc + 1] | (u[pc + 2] << 16))); pc += 3
        elif op == 0x1a:
            a = w >> 8; reg_ok(a); si = u[pc + 1]; chk(si < nS, '%s@%d const-string idx valid' % (mname, pc)); text.append('%3d const-string v%d, %r' % (pc, a, strs[si])); pc += 2
        elif op == 0x22:
            a = w >> 8; reg_ok(a); text.append('%3d new-instance v%d, %s' % (pc, a, T(u[pc + 1]))); pc += 2
        elif op == 0x34:
            a = (w >> 8) & 0xF; b = (w >> 12) & 0xF; off = struct.unpack('<h', struct.pack('<H', u[pc + 1]))[0]; reg_ok(a, b)
            text.append('%3d if-lt v%d, v%d, -> %d' % (pc, a, b, pc + off)); branch.append((pc, pc + off)); pc += 2
        elif op == 0x60:
            a = w >> 8; f = u[pc + 1]; reg_ok(a); chk(f < nF, '%s@%d sget field idx valid' % (mname, pc))
            text.append('%3d sget v%d, %s.%s' % (pc, a, T(fields[f][0]), strs[fields[f][2]])); pc += 2
        elif op == 0x59:
            a = (w >> 8) & 0xF; b = (w >> 12) & 0xF; f = u[pc + 1]; reg_ok(a, b); chk(f < nF, '%s@%d iput field idx valid' % (mname, pc))
            text.append('%3d iput v%d, v%d, %s.%s' % (pc, a, b, T(fields[f][0]), strs[fields[f][2]])); pc += 2
        elif op in (0x6e, 0x6f, 0x70):
            n = w >> 12; g = (w >> 8) & 0xF; mi = u[pc + 1]; w3 = u[pc + 2]
            rr = [w3 & 0xF, (w3 >> 4) & 0xF, (w3 >> 8) & 0xF, (w3 >> 12) & 0xF, g][:n]
            chk(mi < nM, '%s@%d method idx valid' % (mname, pc)); reg_ok(*rr); maxout = max(maxout, n)
            m = meths[mi]; nm = {0x6e: 'invoke-virtual', 0x6f: 'invoke-super', 0x70: 'invoke-direct'}[op]
            nparams = len(protos[m[1]][2]) + 1
            chk(nparams == n, '%s@%d %s arg count %d == params+this %d (%s)' % (mname, pc, nm, n, nparams, strs[m[2]]))
            text.append('%3d %s {%s}, %s.%s' % (pc, nm, ', '.join('v%d' % r for r in rr), T(m[0]), strs[m[2]])); pc += 3
        else:
            text.append('%3d ??? opcode %#x' % (pc, op)); chk(False, '%s@%d unknown opcode %#x' % (mname, pc, op)); pc += 1
    print('\n'.join('      ' + t for t in text))
    chk(pc == isz, '%s: instructions tile the code exactly' % mname)
    chk(maxout <= outs, '%s: outs_size %d >= max invoke args %d' % (mname, outs, maxout))
    for a, b in branch: chk(b in starts, '%s: branch %d -> %d lands on an instruction boundary' % (mname, a, b))
    chk(u[isz - 1] == 0x000e, '%s: ends with return-void' % mname)
for kind, mi, acc, cof in codes:
    disasm(cof, strs[meths[mi][2]])
# ---- map list
mo = map_off; n = u32(mo); items = [struct.unpack_from('<HHII', d, mo + 4 + 12 * i) for i in range(n)]
print('   map:', ', '.join('%#x×%d@%d' % (t, c, o) for t, _, c, o in items))
chk(all(items[i][3] < items[i + 1][3] for i in range(n - 1)), 'map items sorted by offset')
byt = {t: (c, o) for t, _, c, o in items}
chk(byt.get(1) == (nS, oS) and byt.get(2) == (nT, oT) and byt.get(3) == (nP, oP) and byt.get(5) == (nM, oM) and byt.get(6) == (nC, oC), 'map matches header counts/offsets')
chk((byt.get(4) == (nF, oF)) if nF else (4 not in byt), 'map field_ids entry consistent')
chk(byt.get(0x1000) == (1, map_off), 'map_list self entry')
print('\nRESULT:', 'ALL OK' if not bad else '%d FAILURES' % bad)
sys.exit(1 if bad else 0)
