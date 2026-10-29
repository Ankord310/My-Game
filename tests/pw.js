// Подключение Playwright: из tests/node_modules (npm i) или из глобальной установки
let pw;
try{pw=require('playwright')}
catch(e){try{pw=require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright')}
  catch(e2){console.error('Нужен Playwright: cd tests && npm i && npx playwright install chromium');process.exit(1)}}
module.exports=pw;
