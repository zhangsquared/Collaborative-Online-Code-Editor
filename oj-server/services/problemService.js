const ProblemModel = require('../models/problemModel');

const getProblems = function() {
  return new Promise((resolve, reject) => {
    ProblemModel.find({}, function(err, problems) {
      if(err) { 
        reject(err); 
      } else { 
        resolve(problems);
      }
    });
  });
}
  
const getProblem = function(id) {
  return new Promise((resolve, reject) => {
    ProblemModel.findOne({id: id}, function(err, p) {
      if(err) { reject(err); }
      else { resolve(p); }
    });
  });
}

const addProblem = function(newProblem) {
	return new Promise((resolve, reject) => {
		ProblemModel.findOne({name: newProblem.name}, (err, data) => {
			if (data) {
				reject('Problem already exists');
			} else {
				ProblemModel.count({}, (err, count) => {
					newProblem.id = count + 1;
					const mongoProblem = new ProblemModel(newProblem);
					mongoProblem.save().then(resolve(mongoProblem));
				});
			}
		});
	});
}

module.exports = {
    getProblems,
    getProblem,
    addProblem
}