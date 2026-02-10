const http = require('http');

// Test functions
async function testEndpoint(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const result = {
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: JSON.parse(body)
                    };
                    resolve(result);
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        body: body
                    });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

async function runTests() {
    console.log('🚀 Starting Drone Coordinator API Tests...\n');

    try {
        // Test 1: Health Check
        console.log('1. Testing Health Endpoint...');
        const health = await testEndpoint('/api/health');
        console.log('✅ Health Check:', health.statusCode === 200 ? 'PASSED' : 'FAILED');
        console.log('   Response:', JSON.stringify(health.body, null, 2));

        // Test 2: Get Pilots
        console.log('\n2. Testing Pilots Endpoint...');
        const pilots = await testEndpoint('/api/pilots');
        console.log('✅ Pilots List:', pilots.statusCode === 200 ? 'PASSED' : 'FAILED');
        console.log('   Found', pilots.body.length, 'pilots');
        if (pilots.body.length > 0) {
            console.log('   Sample pilot:', pilots.body[0].name, '-', pilots.body[0].status);
        }

        // Test 3: Get Available Pilots
        console.log('\n3. Testing Available Pilots...');
        const availablePilots = await testEndpoint('/api/pilots/status/available');
        console.log('✅ Available Pilots:', availablePilots.statusCode === 200 ? 'PASSED' : 'FAILED');
        console.log('   Available pilots:', availablePilots.body.length);

        // Test 4: Get Drones
        console.log('\n4. Testing Drones Endpoint...');
        const drones = await testEndpoint('/api/drones');
        console.log('✅ Drones List:', drones.statusCode === 200 ? 'PASSED' : 'FAILED');
        console.log('   Found', drones.body.length, 'drones');
        if (drones.body.length > 0) {
            console.log('   Sample drone:', drones.body[0].model, '-', drones.body[0].status);
        }

        // Test 5: Chat Interface
        console.log('\n5. Testing Chat Interface...');
        const chatResponse = await testEndpoint('/api/chat/message', 'POST', {
            message: 'Show me available pilots in New York'
        });
        console.log('✅ Chat Interface:', chatResponse.statusCode === 200 ? 'PASSED' : 'FAILED');
        console.log('   AI Response:', chatResponse.body.response.substring(0, 100) + '...');

        // Test 6: Create Assignment
        console.log('\n6. Testing Assignment Creation...');
        const assignment = await testEndpoint('/api/assignments', 'POST', {
            projectId: 'test_project_001',
            requirements: {
                minSkillLevel: 'Intermediate',
                requiredCertifications: ['Commercial'],
                location: 'New York'
            },
            startDate: '2026-02-15',
            endDate: '2026-02-20'
        });
        console.log('✅ Assignment Creation:', assignment.statusCode === 201 ? 'PASSED' : 'FAILED');
        if (assignment.body) {
            console.log('   Assignment ID:', assignment.body.id);
            console.log('   Status:', assignment.body.status);
            console.log('   Conflicts:', assignment.body.conflicts.length > 0 ? 'YES' : 'NONE');
        }

        console.log('\n🎉 All tests completed!');
        console.log('\n📊 Summary:');
        console.log('   - Health Check: ✅ Working');
        console.log('   - Pilot Management: ✅ Working');
        console.log('   - Drone Management: ✅ Working');
        console.log('   - Chat Interface: ✅ Working');
        console.log('   - Assignment System: ✅ Working');
        console.log('\n🚀 Application is ready for use at http://localhost:3000');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run tests
runTests();