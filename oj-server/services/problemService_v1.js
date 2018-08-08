let problems = [
  {"id" : 1, "name" : "problem1"}, 
  {"id" : 2, "name" : "problem2"}
];

const getProblems = function() {
  return new Promise((resolve, reject) => {
    resolve(problems);
  });
}

const getProblem = function(id) {
  console.log("bunney");
  return new Promise((resolve, reject) => {
    resolve(problems.find(x => x.id === id));
  });
}

const addProblem = function(newProblem) {
  return new Promise((resolve, reject) => {
    problems.push(newProblem);
    resolve(problems);
  });
}

module.exports = {
    getProblems,
    getProblem,
    addProblem
}