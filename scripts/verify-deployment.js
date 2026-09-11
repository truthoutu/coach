/**
 * Deployment Verification Script
 * Run this to verify your deployed site is working correctly
 * 
 * Usage: node scripts/verify-deployment.js https://your-site.vercel.app
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000';

console.log(`🔍 Verifying deployment at: ${BASE_URL}\n`);

async function verify() {
  const checks = {
    passed: [],
    failed: [],
    warnings: []
  };

  // Check 1: Products API
  try {
    console.log('✓ Checking Products API...');
    const res = await fetch(`${BASE_URL}/api/products`);
    const data = await res.json();
    
    if (res.ok && Array.isArray(data)) {
      if (data.length === 0) {
        checks.warnings.push('⚠️  Products API works but database is empty - needs seeding');
      } else {
        checks.passed.push(`✅ Products API: ${data.length} products found`);
      }
    } else {
      checks.failed.push('❌ Products API: Failed to fetch');
    }
  } catch (err) {
    checks.failed.push(`❌ Products API: ${err.message}`);
  }

  // Check 2: Campaigns API
  try {
    console.log('✓ Checking Campaigns API...');
    const res = await fetch(`${BASE_URL}/api/campaigns`);
    const data = await res.json();
    
    if (res.ok && Array.isArray(data)) {
      if (data.length === 0) {
        checks.warnings.push('⚠️  Campaigns API works but database is empty - needs seeding');
      } else {
        checks.passed.push(`✅ Campaigns API: ${data.length} campaigns found`);
      }
    } else {
      checks.failed.push('❌ Campaigns API: Failed to fetch');
    }
  } catch (err) {
    checks.failed.push(`❌ Campaigns API: ${err.message}`);
  }

  // Check 3: Homepage
  try {
    console.log('✓ Checking Homepage...');
    const res = await fetch(BASE_URL);
    
    if (res.ok) {
      checks.passed.push('✅ Homepage: Loads successfully');
    } else {
      checks.failed.push(`❌ Homepage: Status ${res.status}`);
    }
  } catch (err) {
    checks.failed.push(`❌ Homepage: ${err.message}`);
  }

  // Check 4: Admin Page
  try {
    console.log('✓ Checking Admin Page...');
    const res = await fetch(`${BASE_URL}/admin`);
    
    if (res.ok) {
      checks.passed.push('✅ Admin Page: Accessible');
    } else {
      checks.failed.push(`❌ Admin Page: Status ${res.status}`);
    }
  } catch (err) {
    checks.failed.push(`❌ Admin Page: ${err.message}`);
  }

  // Check 5: Cart Page
  try {
    console.log('✓ Checking Cart Page...');
    const res = await fetch(`${BASE_URL}/cart`);
    
    if (res.ok) {
      checks.passed.push('✅ Cart Page: Accessible');
    } else {
      checks.failed.push(`❌ Cart Page: Status ${res.status}`);
    }
  } catch (err) {
    checks.failed.push(`❌ Cart Page: ${err.message}`);
  }

  // Check 6: Checkout Page
  try {
    console.log('✓ Checking Checkout Page...');
    const res = await fetch(`${BASE_URL}/checkout`);
    
    if (res.ok) {
      const html = await res.text();
      
      // Verify WhatsApp number
      if (html.includes('wa.me/15058006924')) {
        checks.passed.push('✅ WhatsApp Integration: Correctly configured');
      } else {
        checks.failed.push('❌ WhatsApp Integration: Number not found or incorrect');
      }
      
      // Verify Bitcoin address
      if (html.includes('bc1qgt2sl66ykgs272p03rk5e4c92vcwr80y8k6s4t')) {
        checks.passed.push('✅ Bitcoin Address: Correctly configured');
      } else {
        checks.failed.push('❌ Bitcoin Address: Not found or incorrect');
      }
      
      checks.passed.push('✅ Checkout Page: Accessible');
    } else {
      checks.failed.push(`❌ Checkout Page: Status ${res.status}`);
    }
  } catch (err) {
    checks.failed.push(`❌ Checkout Page: ${err.message}`);
  }

  // Print Results
  console.log('\n' + '='.repeat(60));
  console.log('📊 VERIFICATION RESULTS');
  console.log('='.repeat(60) + '\n');

  if (checks.passed.length > 0) {
    console.log('✅ PASSED CHECKS:\n');
    checks.passed.forEach(msg => console.log(`   ${msg}`));
    console.log('');
  }

  if (checks.warnings.length > 0) {
    console.log('⚠️  WARNINGS:\n');
    checks.warnings.forEach(msg => console.log(`   ${msg}`));
    console.log('');
  }

  if (checks.failed.length > 0) {
    console.log('❌ FAILED CHECKS:\n');
    checks.failed.forEach(msg => console.log(`   ${msg}`));
    console.log('');
  }

  console.log('='.repeat(60));
  
  const total = checks.passed.length + checks.failed.length;
  const score = checks.passed.length / total * 100;
  
  console.log(`\n📈 Score: ${checks.passed.length}/${total} (${score.toFixed(0)}%)\n`);

  if (checks.warnings.length > 0) {
    console.log('💡 NEXT STEPS:');
    console.log('   Run: npm run db:seed');
    console.log('   Or visit: DEPLOYMENT.md for seeding instructions\n');
  }

  if (checks.failed.length === 0 && checks.warnings.length === 0) {
    console.log('🎉 All checks passed! Your deployment is ready.\n');
  }
}

verify().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
