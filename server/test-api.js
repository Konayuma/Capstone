import assert from 'node:assert';
import http from 'http';
import app from './src/index.js';

// Spin up test server on port 5001
const PORT = 5001;
const BASE_URL = `http://localhost:${PORT}/api`;

let server;

function startServer() {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(PORT, () => {
      console.log(`[TEST] Test server started on port ${PORT}`);
      resolve();
    });
  });
}

function stopServer() {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        console.log('[TEST] Test server stopped.');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

// Helper to issue requests
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  return {
    status: response.status,
    headers: response.headers,
    data,
  };
}

async function runTests() {
  try {
    await startServer();

    console.log('\n--- STARTING CAPSTONEGUARD AI INTEGRATION TESTS ---\n');

    let token = '';
    let projectId = null;
    let requirementId = null;
    let taskId = null;

    // Test 1: User Login
    console.log('[TEST 1] Logging in as Sepo (Student & Group Leader)...');
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'sepo@student.com',
        password: 'student123',
      }),
    });

    assert.strictEqual(loginRes.status, 200);
    assert.ok(loginRes.data.token);
    assert.strictEqual(loginRes.data.user.email, 'sepo@student.com');
    token = loginRes.data.token;
    console.log('✔ Login successful.');

    const authHeaders = { Authorization: `Bearer ${token}` };

    // Test 2: List Projects
    console.log('[TEST 2] Fetching active project workspaces...');
    const projectListRes = await request('/projects', {
      headers: authHeaders,
    });

    assert.strictEqual(projectListRes.status, 200);
    assert.ok(Array.isArray(projectListRes.data));
    assert.ok(projectListRes.data.length > 0);
    projectId = projectListRes.data[0].id;
    console.log(`✔ Found project workspace: "${projectListRes.data[0].title}" (ID: ${projectId})`);

    // Test 3: Get Project details
    console.log(`[TEST 3] Fetching details for project ${projectId}...`);
    const projectDetailRes = await request(`/projects/${projectId}`, {
      headers: authHeaders,
    });
    assert.strictEqual(projectDetailRes.status, 200);
    assert.strictEqual(projectDetailRes.data.id, projectId);
    console.log('✔ Fetched details successfully.');

    // Test 4: Create new raw requirement
    console.log('[TEST 4] Creating a raw project requirement...');
    const createReqRes = await request(`/projects/${projectId}/requirements`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        type: 'functional',
        title: 'Submit Insurance Claim',
        description: 'Allow farmers to claim compensation easily online.',
        priority: 'high',
      }),
    });

    assert.strictEqual(createReqRes.status, 201);
    assert.strictEqual(createReqRes.data.title, 'Submit Insurance Claim');
    requirementId = createReqRes.data.id;
    console.log(`✔ Created requirement with ID: ${requirementId}`);

    // Test 5: Update Requirement
    console.log(`[TEST 5] Approving requirement ${requirementId}...`);
    const updateReqRes = await request(`/projects/requirements/${requirementId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        status: 'approved',
      }),
    });
    assert.strictEqual(updateReqRes.status, 200);
    assert.strictEqual(updateReqRes.data.status, 'approved');
    console.log('✔ Requirement approved.');

    // Test 6: Create a task linked to requirement
    console.log('[TEST 6] Creating project task linked to requirement...');
    const createTaskRes = await request(`/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Build claim submission form frontend',
        description: 'React form with file evidence uploads.',
        assignedTo: 3, // Sepo's ID in database
        priority: 'high',
        status: 'todo',
        deadline: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days from now
        requirementId: requirementId,
      }),
    });

    assert.strictEqual(createTaskRes.status, 201);
    assert.strictEqual(createTaskRes.data.title, 'Build claim submission form frontend');
    taskId = createTaskRes.data.id;
    console.log(`✔ Created task with ID: ${taskId}`);

    // Test 7: Get Contribution Scoring Report
    console.log('[TEST 7] Compiling individual member contribution metrics...');
    const contribRes = await request(`/projects/${projectId}/contribution-report`, {
      headers: authHeaders,
    });

    assert.strictEqual(contribRes.status, 200);
    assert.ok(Array.isArray(contribRes.data.members));
    assert.ok(Array.isArray(contribRes.data.warnings));
    console.log('✔ Contribution report generated.');
    contribRes.data.members.forEach(m => {
      console.log(`   - ${m.name} (${m.role}): Final Score ${m.finalScore}%`);
    });

    // Test 8: Generate PDF report headers check
    console.log('[TEST 8] Requesting Requirements PDF Report...');
    const pdfRes = await request(`/projects/${projectId}/reports/requirements`, {
      headers: authHeaders,
    });
    assert.strictEqual(pdfRes.status, 200);
    assert.strictEqual(pdfRes.headers.get('content-type'), 'application/pdf');
    console.log('✔ Requirements PDF Report headers verified successfully.');

    // Test 9: Get platform statistics (requires Admin Login)
    console.log('[TEST 9] Logging in as Admin...');
    const adminLoginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@capstoneguard.ai',
        password: 'admin123',
      }),
    });
    assert.strictEqual(adminLoginRes.status, 200);
    const adminToken = adminLoginRes.data.token;
    
    console.log('[TEST 9.1] Fetching admin usage metrics dashboard...');
    const adminStatsRes = await request('/admin/stats', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(adminStatsRes.status, 200);
    assert.ok(adminStatsRes.data.totals);
    assert.ok(adminStatsRes.data.totals.users > 0);
    console.log('✔ System stats aggregated.');
    console.log(`   - Total users: ${adminStatsRes.data.totals.users}`);
    console.log(`   - Total projects: ${adminStatsRes.data.totals.projects}`);

    console.log('\n--- ALL API INTEGRATION TESTS PASSED SUCCESSFULLY! ---\n');
  } catch (error) {
    console.error('\n❌ INTEGRATION TESTS FAILED:', error);
    process.exitCode = 1;
  } finally {
    await stopServer();
  }
}

runTests();
