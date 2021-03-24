const express = require('express');
const app = express();

// Import MW for parsing POST params in BODY
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

// Import MW supporting Method Override with express
const methodOverride = require('method-override');
app.use(methodOverride('_method', { methods: ["POST", "GET"] }));

// ========== MODEL ==========

const Sequelize = require('sequelize');

const options = { logging: false, operatorsAliases: false };
const sequelize = new Sequelize("sqlite:db.sqlite", options);

const Quiz = sequelize.define( // define Quiz model (table quizzes)
    'quiz', {
        question: Sequelize.STRING,
        answer: Sequelize.STRING
    }
);

(async () => {  // IIFE - Immediatedly Invoked Function Expresión
    try {
        await sequelize.sync(); // Syncronize DB and seed if needed
        const count = await Quiz.count();
        if (count === 0) {
            const c = await Quiz.bulkCreate([
                {question: "Capital of Italy", answer: "Rome"},
                {question: "Capital of France", answer: "Paris"},
                {question: "Capital of Spain", answer: "Madrid"},
                {question: "Capital of Portugal", answer: "Lisbon"}
            ]);
            console.log(`DB filled with ${c.length} quizzes.`);
        } else {
            console.log(`DB exists & has ${count} quizzes.`);
        }
    } catch (err) {
        console.log(err);
    }
})();

// ========== VIEWs ==========
// CSS style to include into the views:
const style = `
        <style>
            body { font-family: sans-serif; }
            .button { display: inline-block; text-decoration: none;
                padding: 2px 6px; margin: 2px;
                background: #4479BA; color: #FFF;
                border-radius: 4px; border: solid 1px #20538D; }
            .button:hover { background: #356094; }
            td, tr, th { padding: 10px; border: 0px;}
            tbody tr:nth-child(odd) {
                background: #eee;
              }
            table {
                border-collapse: collapse;
              }
            
        </style>`;

// View to display all the quizzes in quizzes array
const indexView = quizzes =>
    `<!doctype html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Quiz</title>
        ${style}
    </head>
    <body>
        <h1>Quizzes</h1>
        <table class="default">
        <tr id="header">
        <th>ID</th>
        <th>Pregunta</th>
        <th></th>
        <th></th>
      </tr>` +
    quizzes.map(quiz =>
        `<tr id="Q${quiz.id}">
                <td>${quiz.id}</td>
                <td><a href="/quizzes/${quiz.id}/play">${quiz.question}</a></td>
                <td><a href="/quizzes/${quiz.id}/edit"
                   class="button">Edit</a></td>
                <td><a href="/quizzes/${quiz.id}?_method=DELETE"
                   onClick="return confirm('Delete: ${quiz.question}')"
                   class="button">Delete ID: ${quiz.id}</a></td>
             </tr>`).join("\n") +
    ` </table>
    <a href="/quizzes/new" class="button">New Quiz</a>
    </body>
    </html>`;


// View with form for trying to guess quiz
// response - text of last trial (hidden param)
const playView = (quiz, response) =>
    `<!doctype html>
  <html>
  <head>
      <meta charset="utf-8">
      <title>Quiz</title>
      ${style}
  </head>
  <body>
      <h1>Play Quiz</h1>
      <form method="get" action="/quizzes/${quiz.id}/check">
          <label for="response">${quiz.question}: </label>
          <br>
          <input type="text" name="response" value="${response}" placeholder="Answer">
          <input type="submit" class="button" value="Check">
      </form>
      <br>
      <a href="/quizzes" class="button">Go back</a>
  </body>
  </html>`;


// View with the result of trying to guess the quiz.
// id - played quiz id
// msg - result of trial
// response - user answer for next trial
const resultView = (id, msg, response) =>
    `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Quiz</title>
      ${style}
  </head>
  <body>
    <h1>Result</h1>
    <div id="msg"><strong>${msg}</strong></div>
    <a href="/quizzes" class="button">Go back</a>
    <a href="/quizzes/${id}/play?response=${response}" class="button">Try again</a>
  </body>
  </html>`;


// View to show the form to create a new quiz.
const newView = quiz => {
    return `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Quiz Gonzalo Zorrilla</title>
    ${style}
  </head>
  <body>
    <h1>Create New Quiz</h1>
    <form method="POST" action="/quizzes">
      <label for="question">Question: </label>
      <input type="text" name="question" value="${quiz.question}" placeholder="Question"> 
      <br>
      <label for="answer">Answer: </label>
      <input type="text" name="answer" value="${quiz.answer}" placeholder="Answer">
      <input type="submit" class="button" value="Create">
    </form>
    <br>
    <a href="/quizzes" class="button">Go back</a>
  </body>
  </html>`;
}


// View to show a form to edit a given quiz.
const editView = (quiz) => {
    return `<!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Quiz</title>
      ${style}
    </head>
    <body>
      <h1>Create New Quiz</h1>
      <form method="POST" action="/quizzes/${quiz.id}/update?_method=PUT">
    <!--  <input type="hidden" name="_method" value="PUT">   -->
        <label for="question">Question: </label>
        <input type="text" name="question" value="${quiz.question}" placeholder="Question"> 
        <br>
        <label for="answer">Answer: </label>
        <input type="text" name="answer" value="${quiz.answer}" placeholder="Answer">
        <input type="submit" class="button" value="Update">
      </form>
      <br>
      <a href="/quizzes" class="button">Go back</a>
    </body>
    </html>`;
}


// ========== CONTROLLERs ==========

// GET /, GET /quizzes
const indexController = async (req, res, next) => {
    try {
        const quizzes = await Quiz.findAll()
        res.send(indexView(quizzes))
        //Para efectos de depuracion
        //console.log(`New Query of Quizzes`);
    } catch (err) {
        next(err);
    }
};

//  GET  /quizzes/:id/play
const playController = async (req, res, next) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return next(new Error(`"${req.params.id}" should be number.`));

    const response = req.query.response || "";

    try {
        const quiz = await Quiz.findByPk(id);
        if (quiz) res.send(playView(quiz, response));
        else next(new Error(`Quiz ${id} not found.`));
    } catch (err) {
        next(err)
    }
};

//  GET  /quizzes/:id/check
const checkController = async (req, res, next) => {
    const response = req.query.response;

    const id = Number(req.params.id);
    if (Number.isNaN(id)) return next(new Error(`"${req.params.id}" should be number.`));

    try {
        const quiz = await Quiz.findByPk(id);
        if (!quiz) return next(new Error(`Quiz ${id} not found.`));
        let msg = (quiz.answer.toLowerCase().trim() === response.toLowerCase().trim())
            ? `Yes, "${response}" is the ${quiz.question}`
            : `No, "${response}" is not the ${quiz.question}`;
        res.send(resultView(id, msg, response));
    } catch (err) {
        next(err)
    }
};

// GET /quizzes/new
const newController = async (req, res, next) => {
    const quiz = {question: "", answer: ""};
    res.send(newView(quiz));
};

// POST /quizzes
const createController = async (req, res, next) => {
    const {question, answer} = req.body;

    try {
        await Quiz.create({question, answer});
        console.log(`New Quiz Was Created "${question}"`);
        res.redirect(`/quizzes`);
    } catch (err) {
        next(err)
    }
};

//  GET /quizzes/:id/edit
//Para edit controler se reciben los parámetros
const editController = async (req, res, next) => {

    // se intenta convertir el parámetro id en un número
    const id = Number(req.params.id);

    //se verifica si id es número y de lo contrario se lanza un error
    if (Number.isNaN(id)) return next(new Error(`"${req.params.id}" should be number.`));

    //si id es numero, continua y busca el quiz con esa id
    try {
        let quiz = await Quiz.findByPk(id);
        //Verifica la existencia del quiz y si no envía un error
        if (!quiz) return next(new Error(`Quiz ${id} not found.`));
        //Si todo está bien solicita la vista de edición
        res.send(editView(quiz));
    } catch (err) {
        next(err)
    }


    //res.send(editView(quiz));
    
};

//  PUT /quizzes/:id
const updateController = async (req, res, next) => {
    // .... introducir código
    //const {question, answer} = req.body;
    const id = Number(req.params.id);

    //PARA EL CASO EN POST los parametros pasan en el body
    const {question, answer} = req.body;

    try {
        //Se busca el registro a modificar
        let quiz = await Quiz.findByPk(Number(id));
        
        //Se modifican los parámetros en la instancia del registro
        quiz.question = question;
        quiz.answer = answer;

        //Se salvan los cambios de los campos indicados
        await quiz.save({fields: ["question", "answer"]});

        //Se lanza un mensaje por consola indicando que fue editado el quiz
        console.log(`Quiz ${id} was edited.`);

        //Se redirige a la lista de quizzes
        res.redirect(`/quizzes`);

    } catch (err) {
        next(err)
    }
};

// DELETE /quizzes/:id
const destroyController = async (req, res, next) => {
        // se intenta convertir el parámetro id en un número
        const id = Number(req.params.id);
        console.log(typeof id);

        //se verifica si id es número y de lo contrario se lanza un error
        if (Number.isNaN(id)) return next(new Error(`"${req.params.id}" should be number.`));

        try {
        let quiz = await Quiz.findByPk(id);
        
        //Verifica la existencia del quiz y si no envía un error
        if (!quiz) return next(new Error(`Quiz ${id} not found.`));
        //Si todo está bien solicita la vista de edición

        let n = await Quiz.destroy({ where: {id }});
        if (n===0) throw new Error(`Quiz ${id} not in DB`);
        console.log(`Quiz ${id} deleted from DB`);
        
        const quizzes = await Quiz.findAll()
        res.send(indexView(quizzes));

    } catch (err) {
        next(err)
    }


};


// ========== ROUTES ==========

app.get(['/', '/quizzes'], indexController);
app.get('/quizzes/:id/play', playController);
app.get('/quizzes/:id/check', checkController);
app.get('/quizzes/new', newController);
app.post('/quizzes', createController);


// ..... crear rutas e instalar los MWs para:

//   GET  /quizzes/:id/edit
app.get('/quizzes/:id/edit', editController);

//   PUT  /quizzes/:id
app.put('/quizzes/:id/update', updateController);

//   DELETE  /quizzes/:id
app.delete('/quizzes/:id', destroyController);




app.all('*', (req, res) =>
    res.status(404).send("Error: resource not found or method not supported.")
);


// Middleware to manage errors:
app.use((error, req, res, next) => {
    console.log("Error:", error.message || error);
    res.redirect("/");
});

// Server started at port 8000
app.listen(8000);
