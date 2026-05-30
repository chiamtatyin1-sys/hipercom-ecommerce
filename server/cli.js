#!/usr/bin/env node

/**
 * HiperCom CLI - AI Agent Maintenance Tool
 * 
 * Usage:
 *   node cli.js <command> [options]
 *
 * Commands:
 *   status       - Check system status
 *   ai-status    - Check AI configuration
 *   ai-reload    - Reload AI system prompt
 *   ai-test     - Test AI chat
 *   db-status    - Check database status
 *   email-test   - Test email sending
 *   fix-stock    - Fix stock inconsistencies
 */

import { exec } from 'child_process';
import readline from 'readline';
import prisma from './src/db/prisma.js';
import dotenv from 'dotenv';
import { sendEmail } from './src/services/email.js';
import { loadSystemPrompt } from './src/services/ai.js';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function checkStatus() {
  console.log('\n🔍 HiperCom System Status\n');
  
  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database: Connected');
  } catch (e) {
    console.log('❌ Database: Connection failed');
  }
  
  // Check AI
  const aiEnabled = await prisma.settings.findUnique({ where: { key: 'ai_enabled' } });
  const aiProvider = await prisma.settings.findUnique({ where: { key: 'ai_provider' } });
  console.log(`✅ AI Enabled: ${aiEnabled?.value === 'true' ? 'Yes' : 'No'}`);
  console.log(`   Provider: ${aiProvider?.value || 'default'}`);
  
  // Check email
  if (process.env.EMAIL_USER) {
    console.log(`✅ Email: Configured (${process.env.EMAIL_USER})`);
  } else {
    console.log('❌ Email: Not configured');
  }
  
  // Count data
  const [users, products, orders] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.count(),
  ]);
  
  console.log('\n📊 Data Summary:');
  console.log(`   Users: ${users}`);
  console.log(`   Products: ${products}`);
  console.log(`   Orders: ${orders}`);
  
  console.log('');
}

async function checkAIStatus() {
  console.log('\n🤖 AI Configuration\n');
  
  const settings = await prisma.settings.findMany({
    where: { key: { in: ['ai_enabled', 'ai_provider', 'ai_apiKey', 'ai_name', 'ai_systemPrompt', 'ai_llmStudioUrl'] } },
  });
  
  const settingsMap = {};
  settings.forEach(s => settingsMap[s.key] = s.value);
  
  console.log(`Enabled: ${settingsMap.ai_enabled || 'false'}`);
  console.log(`Provider: ${settingsMap.ai_provider || 'default'}`);
  console.log(`Name: ${settingsMap.ai_name || 'JARVIS'}`);
  console.log(`LLM Studio URL: ${settingsMap.ai_llmStudioUrl || 'not set'}`);
  console.log(`API Key: ${settingsMap.ai_apiKey ? '****' + settingsMap.ai_apiKey.slice(-4) : 'not set'}`);
  console.log(`\nSystem Prompt: ${settingsMap.ai_systemPrompt ? settingsMap.ai_systemPrompt.slice(0, 100) + '...' : 'not set'}`);
  console.log('');
}

async function reloadAIPrompt() {
  console.log('\n🔄 Reloading AI System Prompt...\n');
  
  try {
    await loadSystemPrompt();
    console.log('✅ AI system prompt reloaded successfully!');
  } catch (error) {
    console.log('❌ Failed to reload:', error.message);
  }
  console.log('');
}

async function testAI() {
  console.log('\n🧪 Testing AI Chat...\n');
  
  try {
    const { getAIResponse } = await import('./src/services/ai.js');
    const response = await getAIResponse(
      [{ role: 'user', message: 'Hello, what is your name?' }],
      { provider: 'default' }
    );
    console.log('Response:', response);
    console.log('\n✅ AI is working!');
  } catch (error) {
    console.log('❌ AI test failed:', error.message);
  }
  console.log('');
}

async function testEmail() {
  console.log('\n📧 Testing Email...\n');
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('❌ Email not configured in .env');
    return;
  }
  
  try {
    const result = await sendEmail({
      to: process.env.EMAIL_USER,
      template: 'welcome',
      data: { user: { username: 'TestUser' } },
    });
    
    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log(`   Check ${process.env.EMAIL_USER} inbox`);
    } else {
      console.log('❌ Email failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Email test failed:', error.message);
  }
  console.log('');
}

async function fixStock() {
  console.log('\n🔧 Fixing Stock Inconsistencies...\n');
  
  // Find orders with status 'paid' but stock not decremented
  const paidOrders = await prisma.order.findMany({
    where: { status: 'paid' },
    include: { items: true },
  });
  
  console.log(`Found ${paidOrders.length} paid orders`);
  
  let fixed = 0;
  for (const order of paidOrders) {
    for (const item of order.items) {
      if (item.variantId) {
        const variant = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
        if (variant && variant.stock >= item.quantity) {
          await prisma.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
          fixed++;
        }
      } else {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (product && product.stock >= item.quantity) {
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
          fixed++;
        }
      }
    }
  }
  
  console.log(`✅ Fixed ${fixed} stock records`);
  console.log('');
}

async function interactiveMode() {
  console.log('\n🚀 HiperCom CLI - Interactive Mode');
  console.log('Type "help" for commands, "exit" to quit\n');
  
  const loop = async () => {
    const cmd = await ask('hipercom> ');
    const [command, ...args] = cmd.trim().split(/\s+/);
    
    switch (command) {
      case 'status':
        await checkStatus();
        break;
      case 'ai-status':
        await checkAIStatus();
        break;
      case 'ai-reload':
        await reloadAIPrompt();
        break;
      case 'ai-test':
        await testAI();
        break;
      case 'email-test':
        await testEmail();
        break;
      case 'fix-stock':
        await fixStock();
        break;
      case 'help':
        console.log('\nCommands:');
        console.log('  status       - Check system status');
        console.log('  ai-status    - Check AI configuration');
        console.log('  ai-reload    - Reload AI system prompt');
        console.log('  ai-test      - Test AI chat');
        console.log('  email-test   - Test email sending');
        console.log('  fix-stock    - Fix stock inconsistencies');
        console.log('  exit         - Quit\n');
        break;
      case 'exit':
        console.log('Goodbye!\n');
        rl.close();
        process.exit(0);
        return;
      default:
        if (command) console.log(`Unknown command: ${command}. Type "help" for commands.\n`);
    }
    
    loop();
  };
  
  loop();
}

// Main
const command = process.argv[2];
const args = process.argv.slice(3);

(async () => {
  try {
    switch (command) {
      case 'status':
        await checkStatus();
        break;
      case 'ai-status':
        await checkAIStatus();
        break;
      case 'ai-reload':
        await reloadAIPrompt();
        break;
      case 'ai-test':
        await testAI();
        break;
      case 'email-test':
        await testEmail();
        break;
      case 'fix-stock':
        await fixStock();
        break;
      case 'interactive':
      case 'shell':
        await interactiveMode();
        break;
      default:
        console.log('HiperCom CLI - AI Agent Maintenance Tool\n');
        console.log('Usage: node cli.js <command>\n');
        console.log('Commands:');
        console.log('  status       - Check system status');
        console.log('  ai-status    - Check AI configuration');
        console.log('  ai-reload    - Reload AI system prompt');
        console.log('  ai-test      - Test AI chat');
        console.log('  email-test   - Test email sending');
        console.log('  fix-stock    - Fix stock inconsistencies');
        console.log('  interactive  - Interactive shell mode\n');
        console.log('Example: node cli.js status');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
})();
