/**
 * Health Check Service
 * Monitor kesehatan API dan dependencies
 */
const logger = require('../utils/logger');

/**
 * System health check
 */
const checkSystemHealth = async () => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  };

  // Check memory usage
  const memoryUsage = health.memory.heapUsed / health.memory.heapTotal;
  if (memoryUsage > 0.9) {
    health.status = 'degraded';
    logger.warnRequest('High memory usage detected', {
      usage: `${(memoryUsage * 100).toFixed(2)}%`
    });
  }

  return health;
};

/**
 * Readiness check - apakah service siap menerima traffic
 */
const checkReadiness = async () => {
  const readiness = {
    status: 'ready',
    timestamp: new Date().toISOString(),
    checks: {}
  };

  // Check Node.js version
  const nodeVersion = process.version;
  readiness.checks.nodeVersion = {
    status: 'ok',
    version: nodeVersion
  };

  // Check event loop
  const eventLoopLag = await checkEventLoopLag();
  readiness.checks.eventLoop = {
    status: eventLoopLag < 100 ? 'ok' : 'degraded',
    lag: eventLoopLag
  };

  // Check memory
  const memUsage = process.memoryUsage();
  readiness.checks.memory = {
    status: memUsage.heapUsed / memUsage.heapTotal < 0.9 ? 'ok' : 'warning',
    used: memUsage.heapUsed,
    total: memUsage.heapTotal
  };

  // Overall status
  const hasFailure = Object.values(readiness.checks).some(check => check.status === 'error');
  if (hasFailure) {
    readiness.status = 'not_ready';
  }

  return readiness;
};

/**
 * Check event loop lag
 */
const checkEventLoopLag = () => {
  return new Promise((resolve) => {
    const start = process.hrtime.bigint();
    setTimeout(() => {
      const end = process.hrtime.bigint();
      const lag = Number(end - start) / 1000000; // Convert to ms
      resolve(lag - 100); // Subtract the 100ms timeout
    }, 100);
  });
};

/**
 * Liveness probe - apakah service hidup
 */
const checkLiveness = () => {
  return {
    status: 'alive',
    timestamp: new Date().toISOString(),
    pid: process.pid,
    uptime: process.uptime()
  };
};

/**
 * Get system metrics
 */
const getSystemMetrics = () => {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  return {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
      unit: 'MB'
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system,
      unit: 'microseconds'
    },
    loadavg: process.loadavg(),
    platform: process.platform,
    nodeVersion: process.version
  };
};

module.exports = {
  checkSystemHealth,
  checkReadiness,
  checkLiveness,
  getSystemMetrics
};
