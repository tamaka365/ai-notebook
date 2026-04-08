const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const PLAYGROUND_PKG = path.resolve(ROOT_DIR, 'plate-playground-template/package.json');
const ROOT_PKG = path.resolve(ROOT_DIR, 'package.json');

// 读取 package.json 文件
function readJson(filepath) {
  const content = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(content);
}

// 写入 package.json 文件
function writeJson(filepath, data) {
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

// 同步依赖版本号 - 将 playground 的版本号同步到主项目
function syncDependencies() {
  const playgroundPkg = readJson(PLAYGROUND_PKG);
  const rootPkg = readJson(ROOT_PKG);

  let changed = false;

  // 同步 dependencies
  for (const [name, version] of Object.entries(playgroundPkg.dependencies || {})) {
    if (rootPkg.dependencies && rootPkg.dependencies[name]) {
      if (rootPkg.dependencies[name] !== version) {
        console.log(`[deps] ${name}: ${rootPkg.dependencies[name]} -> ${version}`);
        rootPkg.dependencies[name] = version;
        changed = true;
      }
    }
  }

  // 同步 devDependencies
  for (const [name, version] of Object.entries(playgroundPkg.devDependencies || {})) {
    if (rootPkg.devDependencies && rootPkg.devDependencies[name]) {
      if (rootPkg.devDependencies[name] !== version) {
        console.log(`[devDeps] ${name}: ${rootPkg.devDependencies[name]} -> ${version}`);
        rootPkg.devDependencies[name] = version;
        changed = true;
      }
    }
  }

  if (changed) {
    writeJson(ROOT_PKG, rootPkg);
    console.log('\n✓ Dependencies synchronized from plate-playground-template!');
  } else {
    console.log('✓ Dependencies are already in sync.');
  }
}

syncDependencies();
