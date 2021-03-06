import _, { keys } from 'lodash';

import { run } from '../utilities/visual_regression';

module.exports = function (grunt) {
  grunt.registerTask(
    'test:visualRegression:buildGallery',
    'Compare screenshots and generate diff images.',
    function () {
      const done = this.async();
      run(done);
    }
  );

  grunt.registerTask('test:server', [
    'checkPlugins',
    'simplemocha:all',
  ]);

  grunt.registerTask('test:browser', [
    'checkPlugins',
    'run:browserTestServer',
    'karma:unit',
  ]);

  grunt.registerTask('test:browser-ci', () => {
    const ciShardTasks = keys(grunt.config.get('karma'))
      .filter(key => key.startsWith('ciShard-'))
      .map(key => `karma:${key}`);

    grunt.log.ok(`Running UI tests in ${ciShardTasks.length} shards`);

    grunt.task.run([
      'run:browserTestServer',
      ...ciShardTasks
    ]);
  });

  grunt.registerTask('test:coverage', [ 'run:testCoverageServer', 'karma:coverage' ]);

  grunt.registerTask('test:quick', [
    'test:server',
    'test:ui',
    'test:jest',
    'test:jest_integration',
    'test:projects',
    'test:browser',
    'test:api'
  ]);

  grunt.registerTask('test:dev', [
    'checkPlugins',
    'run:devBrowserTestServer',
    'karma:dev'
  ]);

  grunt.registerTask('test:ui', [
    'checkPlugins',
    'run:testEsServer',
    'run:funcTestServer',
    'functional_test_runner:functional',
    'stop:testEsServer',
    'stop:funcTestServer'
  ]);

  grunt.registerTask('test:uiRelease', [
    'checkPlugins',
    'run:testEsServer',
    'run:ossDistFuncTestServer',
    'functional_test_runner:functional',
    'stop:testEsServer',
    'stop:ossDistFuncTestServer'
  ]);

  grunt.registerTask('test:ui:server', [
    'checkPlugins',
    'run:testEsServer',
    'run:devFuncTestServer:keepalive'
  ]);

  grunt.registerTask('test:api', [
    'run:testEsServer',
    'run:apiTestServer',
    'functional_test_runner:apiIntegration',
    'stop:testEsServer',
    'stop:apiTestServer'
  ]);

  grunt.registerTask('test:api:server', [
    'run:testEsServer',
    'run:devApiTestServer:keepalive'
  ]);

  grunt.registerTask('test:api:runner', () => {
    grunt.fail.fatal('test:api:runner has moved, use: `node scripts/functional_test_runner --config test/api_integration/config.js`');
  });

  grunt.registerTask('test', subTask => {
    if (subTask) grunt.fail.fatal(`invalid task "test:${subTask}"`);

    grunt.task.run(_.compact([
      !grunt.option('quick') && 'run:eslint',
      'licenses',
      'test:quick',
      'verifyTranslations',
    ]));
  });

  grunt.registerTask('quick-test', ['test:quick']); // historical alias

  grunt.registerTask('test:projects', function () {
    const done = this.async();
    runProjectsTests().then(done, done);
  });

  function runProjectsTests() {
    const serverCmd = {
      cmd: 'yarn',
      args: ['kbn', 'run', 'test', '--exclude', 'kibana', '--oss', '--skip-kibana-extra'],
      opts: { stdio: 'inherit' }
    };

    return new Promise((resolve, reject) => {
      grunt.util.spawn(serverCmd, (error, result, code) => {
        if (error || code !== 0) {
          const error = new Error(`projects tests exited with code ${code}`);
          grunt.fail.fatal(error);
          reject(error);
          return;
        }

        grunt.log.writeln(result);
        resolve();
      });
    });
  }
};
