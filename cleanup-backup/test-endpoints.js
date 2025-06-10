#!/usr/bin/env node

const axios = require('axios');

async function testQuizEndpoints() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing quiz application endpoints...\n');
  
  try {
    // Test main page
    console.log('📄 Testing main page...');
    const mainResponse = await axios.get(baseUrl);
    console.log(`✅ Main page: ${mainResponse.status} ${mainResponse.statusText}`);
    
    // Test quiz page with azure-a102 ID
    console.log('\n📄 Testing quiz page...');
    const quizResponse = await axios.get(`${baseUrl}/quiz/azure-a102`);
    console.log(`✅ Quiz page (azure-a102): ${quizResponse.status} ${quizResponse.statusText}`);
    
    // Test optimized quiz page
    console.log('\n📄 Testing optimized quiz page...');
    const optimizedResponse = await axios.get(`${baseUrl}/quiz-optimized/azure-a102`);
    console.log(`✅ Optimized quiz page (azure-a102): ${optimizedResponse.status} ${optimizedResponse.statusText}`);
    
    // Test quizzes page
    console.log('\n📄 Testing quizzes page...');
    const quizzesResponse = await axios.get(`${baseUrl}/quizzes`);
    console.log(`✅ Quizzes page: ${quizzesResponse.status} ${quizzesResponse.statusText}`);
    
    // Test quiz type filters page
    console.log('\n📄 Testing quiz type filters page...');
    const filtersResponse = await axios.get(`${baseUrl}/quiz-type-filters`);
    console.log(`✅ Quiz type filters page: ${filtersResponse.status} ${filtersResponse.statusText}`);
    
    console.log('\n🎉 All endpoint tests passed!');
    
  } catch (error) {
    if (error.response) {
      const { status, statusText, config } = error.response;
      console.error(`❌ Request failed: ${config.method?.toUpperCase()} ${config.url}`);
      console.error(`   Status: ${status} ${statusText}`);
    } else if (error.request) {
      console.error('❌ Network error: No response received');
      console.error('   Make sure the development server is running on http://localhost:3000');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

testQuizEndpoints();
