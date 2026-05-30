import { exec, spawn } from 'child_process';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

function log(color, msg) {
  const colors = {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
  };
  console.log(`${colors[color] || ''}${msg}${colors.reset}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkPort(port) {
  return new Promise(resolve => {
    exec(`netstat -ano | findstr "${port}"`, (error, stdout) => {
      resolve(stdout.includes(`:${port}`));
    });
  });
}

async function killProcess(port) {
  return new Promise((resolve, reject) => {
    exec(`netstat -ano | findstr ":${port}"`, (error, stdout) => {
      if (!stdout) return resolve(false);

      const lines = stdout.trim().split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(pid)) {
          exec(`taskkill /F /PID ${pid}`, (err) => {
            if (err) log('red', `Failed to kill PID ${pid}`);
            else log('green', `Killed process on port ${port} (PID: ${pid})`);
          });
        }
      }
      resolve(true);
    });
  });
}

async function startServer(name, cwd, command, port) {
  log('cyan', `\n🚀 Starting ${name}...`);

  const inUse = await checkPort(port);
  if (inUse) {
    log('yellow', `⚠ Port ${port} is in use. Killing process...`);
    await killProcess(port);
    await sleep(1000);
  }

  const child = spawn(command, {
    cwd,
    shell: true,
    stdio: 'inherit',
  });

  child.on('error', (error) => {
    log('red', `✗ ${name} failed to start: ${error.message}`);
  });

  child.on('exit', (code) => {
    log('yellow', `${name} exited with code ${code}`);
  });

  log('green', `✓ ${name} started on port ${port}`);
  return child;
}

async function checkHealth(name, port) {
  log('cyan', `\n🔍 Checking ${name} health...`);

  try {
    const response = await fetch(`http://localhost:${port}${name === 'Server' ? '/api/health' : '/'}`);
    if (response.ok) {
      log('green', `✓ ${name} is running on port ${port}`);
      return true;
    } else {
      log('red', `✗ ${name} returned ${response.status}`);
      return false;
    }
  } catch (error) {
    log('red', `✗ ${name} is not responding on port ${port}`);
    return false;
  }
}

async function showStatus() {
  log('cyan', '\n=== Server Status ===\n');

  const serverHealth = await checkHealth('Server', 3001);
  const clientHealth = await checkHealth('Client', 5173);

  log('blue', '\n📊 Summary:');
  console.table([
    { Service: 'Backend Server', Port: 3001, Status: serverHealth ? 'Running' : 'Stopped' },
    { Service: 'Frontend Client', Port: 5173, Status: clientHealth ? 'Running' : 'Stopped' },
  ]);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const projectRoot = path.resolve(__dirname, '../..');
  const serverDir = path.join(projectRoot, 'server');
  const clientDir = path.join(projectRoot, 'client');

  switch (command) {
    case 'start': {
      log('cyan', '\n🚀 Starting all servers...\n');

      await startServer('Backend Server', serverDir, 'npm run dev', 3001);
      await sleep(2000);
      await startServer('Frontend Client', clientDir, 'npm run dev', 5173);

      log('cyan', '\n✅ All servers started!');
      log('blue', '  Backend: http://localhost:3001');
      log('blue', '  Frontend: http://localhost:5173\n');
      break;
    }
    case 'stop': {
      log('cyan', '\n🛑 Stopping all servers...\n');

      await killProcess(3001);
      await killProcess(5173);

      log('green', '\n✅ All servers stopped\n');
      break;
    }
    case 'restart': {
      log('cyan', '\n🔄 Restarting all servers...\n');

      await killProcess(3001);
      await killProcess(5173);
      await sleep(2000);

      await startServer('Backend Server', serverDir, 'npm run dev', 3001);
      await sleep(2000);
      await startServer('Frontend Client', clientDir, 'npm run dev', 5173);

      log('cyan', '\n✅ All servers restarted!');
      log('blue', '  Backend: http://localhost:3001');
      log('blue', '  Frontend: http://localhost:5173\n');
      break;
    }
    case 'status': {
      await showStatus();
      break;
    }
    case 'health': {
      await showStatus();
      break;
    }
    case 'seed': {
      log('cyan', '\n🌱 Running database seed...\n');
      exec('npm run db:seed', { cwd: serverDir, stdio: 'inherit' }, (error) => {
        if (error) log('red', '✗ Seed failed');
        else log('green', '✓ Seed completed');
      });
      break;
    }
    case 'migrate': {
      log('cyan', '\n📦 Running database migration...\n');
      exec('npm run db:migrate', { cwd: serverDir, stdio: 'inherit' }, (error) => {
        if (error) log('red', '✗ Migration failed');
        else log('green', '✓ Migration completed');
      });
      break;
    }
    case 'push': {
      log('cyan', '\n📦 Pushing schema to database...\n');
      exec('npx prisma db push', { cwd: serverDir, stdio: 'inherit' }, (error) => {
        if (error) log('red', '✗ Push failed');
        else log('green', '✓ Schema pushed');
      });
      break;
    }
    case 'reset': {
      const confirm = await ask('⚠️ This will reset the database. Are you sure? (yes/no): ');
      if (confirm.toLowerCase() === 'yes') {
        log('cyan', '\n🔄 Resetting database...\n');
        exec('npm run db:reset', { cwd: serverDir, stdio: 'inherit' }, async (error) => {
          if (error) log('red', '✗ Reset failed');
          else {
            log('green', '✓ Database reset');
            const seedConfirm = await ask('Run seed now? (yes/no): ');
            if (seedConfirm.toLowerCase() === 'yes') {
              exec('npm run db:seed', { cwd: serverDir, stdio: 'inherit' }, (err) => {
                if (err) log('red', '✗ Seed failed');
                else log('green', '✓ Seed completed');
              });
            }
          }
        });
      } else {
        log('yellow', 'Cancelled');
      }
      break;
    }
    case 'test': {
      log('cyan', '\n🧪 Running tests...\n');
      exec('node cli.js test api', { cwd: serverDir, stdio: 'inherit' }, (error) => {
        if (error) log('red', '✗ Tests failed');
        else log('green', '✓ Tests completed');
      });
      break;
    }
    case 'generate': {
      const type = args[1] || 'products';
      const count = args[2] || '10';
      log('cyan', `\n🎲 Generating ${count} test ${type}...\n`);
      exec(`node cli.js generate ${type} ${count}`, { cwd: serverDir, stdio: 'inherit' }, (error) => {
        if (error) log('red', '✗ Generation failed');
        else log('green', `✓ Generated ${count} test ${type}`);
      });
      break;
    }
    case 'help':
    default:
      console.log(`
Dev Manager - E-Commerce Development Tool

Usage: node dev-manager.js <command> [options]

Commands:
  start           - Start all servers (backend + frontend)
  stop            - Stop all servers
  restart         - Restart all servers
  status          - Check server status
  health          - Check server health
  seed            - Run database seed
  migrate         - Run database migration
  push            - Push schema to database
  reset           - Reset database (with confirmation)
  test            - Run API tests
  generate <type> [count] - Generate test data (products, orders, customers, reviews)
  help            - Show this help

Examples:
  node dev-manager.js start
  node dev-manager.js status
  node dev-manager.js generate products 20
  node dev-manager.js reset
  `);
  }

  rl.close();
}

main();
