const express = require('express');
const router = express.Router();

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const nodeRestClient = require('node-rest-client').Client;
const restClient = new nodeRestClient();

// previous code
// EXECUTOR_SERVER_URL = 'http://localhost:5000/build_and_run'; // flask defautl port: 5000

// ngnix load balancer
EXECUTOR_SERVER_URL = 'http://executor/build_and_run'; // flask defautl port: 5000

restClient.registerMethod('build_and_run', EXECUTOR_SERVER_URL, 'POST');

const problemService = require('../services/problemService');

router.get('/problems', function(req, res) {
  problemService.getProblems()
    .then(ps => res.json(ps));
});

router.get('/problems/:id', function(req, res) {
  const id = req.params.id;
  problemService.getProblem(+id)
    .then(p => res.json(p));
});

router.post('/problems', jsonParser, function(req, res) {
  problemService.addProblem(req.body)
    .then(ps => { res.json(ps); }, 
    (error) => res.status(400).send('Problem name already exists!'));
});

router.post('/build_and_run', jsonParser, (req, res) => {
  const code = req.body.code;
  const lang = req.body.lang;

  console.log(`Server received
  lang: ${lang}, user code: ${code}`);

  restClient.methods.build_and_run(
    {
      data: {code: code, lang: lang},
      headers: { 'Content-Type': 'application/json'}
    },
    (data, response) => {
      const text = `Build output: ${data['build']}, execute output: ${data['run']}`;
      res.json(text);
    });
});

module.exports = router;