//Se usa zombie para simular la navegación
const Browser = require('zombie');

//Se usa chai para validar asersiones
let chai = require('chai');

//Se usa DOMPARSER para usar el html extraido de Zombie y buscar valores en el DOM correspondiente a las pruebas
var DOMParser = require("xmldom").DOMParser;

//Se usa key-events para simular el enter cuando aparece un alert
const KeyboardEvent = require('key-events')

//Se crea una variable para verificar pasar el ID de la pregunta creada entre las distintas pruebas
var ID_pregunta_prueba;

//FUNCION PARA SIMULAR ENTER PARA PASAR ALERT AL PULSAR DELETE
const ke = new KeyboardEvent('keydown', {
    bubbles: true, cancelable: true, keyCode: 13
});

//Asertion Style
chai.should();

//before (function (){ console.log(' -before all tests')});
//after (function (){ console.log(' -after all tests')});


//Test group 1
describe('## GRUPO 1: TEST UNITARIOS CON ZOMBIE - PRUEBA DEL SERVIDOR, VISTA DE NUEVO QUIZ Y CREACIÓN DE UNA PREGUNTA', function(){
    //NUEVO BROWSER ZOMBIE
    const browser = new Browser();
    
    //INICIAR CON CONEXIÓN AL LOCALHOST
    before (function (){ console.log('  '); return browser.visit("http://localhost:8000/quizzes/new");});
    //after (function (){ console.log(' -After test group 3')});


    //Test unitario 4
    it('TEST 1- VERIFICA SI SE PUDO CONECTAR AL LOCALHOST:8000', function(){
        //console.log('  -Unit test 4');
        browser.assert.success();
        //throw new Error('Unit 3 test Error');
    });


    //Test unitario 2 verifica conexión con la ruta para crear nueva
    it('TEST 2 - VERIFICA SI SE PUDO CONECTAR A LA RUTA PARA CREACIÓN DE NUEVOS QUIZES - FUNC: FUNCIONAMIENTO DE LA RUTA', function() {
        browser.assert.url('http://localhost:8000/quizzes/new');
    });

        //Test unitario 3 verifica la página web
    it('TEST 3 - VERIFICA SI EL TITLE DE LA PÁGINA CORRESPONDE CON EL DEFINIDO ("Quiz Gonzalo Zorrilla") - FUNC: VISTA MOSTRADA AL USUARIO', function() {
        browser.assert.text('title', 'Quiz Gonzalo Zorrilla');
    });

    //Test unitario 4 llena el fomulario y lo envía
    it('TEST 4 - LLENA EL FORMULARIO Y ENVÍA LA PREGUNTA DE PRUEBA - FUNC: FUNCIONAMIENTO DEL FORMULARIO',function() {
        browser.fill('question', 'Pregunta de prueba 111');
        browser.fill('answer', 'Respuesta de prueba 222');
        return browser.pressButton('Create');

        
    });

    //Test unitario 7
    it('TEST 5 - VERIFICA SI SE REDIRIGE CORRECTAMENTE AL USUARIO A QUIZZES DESPUÉS DE CREAR LA PREGUNTA - FUNC: FUNCIONAMIENTO DEL CONTROLADOR', function() {
        browser.assert.url({pathname: "/quizzes"});
    });

});

describe('## GRUPO 2: TEST UNITARIOS CON ZOMBIE - BUSQUEDA DE LA PREGUNTA CREADA Y VERIFICACIÓN DE LA MISMA, ACCESO A BD Y VISTAS)', function(){
        const browser = new Browser();
        
    
        before (function (){ console.log('  '); return browser.visit("http://localhost:8000/quizzes");});

    
    //TEST PARA VERIFICAR LA CREACION DE LA ÚTLIMA PREGUNTA
    it('TEST 6 - VERIFICA CREACION DE PREGUNTA QUE CORRESPONDE CON LA PREGUNTA DE PRUEBA  - FUNC:  - ACCESO A BD Y VISTA MOSTRADA AL USUARIO', function() {
        //CAPTURO EL HTML COMPLETO
        let html = browser.html();

        console.log(' ');
        console.log('----------------- INFORMACIÓN TECNICA DE CREACIÓN DEL DOM -------------------');

        //GENERO EL DOM PARA PODER BUSCAR LOS ELEMENTOS USANDO DOMPARSER
        let codigo = new DOMParser();
        let oDOM = codigo.parseFromString(html, "text/xml");

        console.log('----------------- INFORMACIÓN TECNICA DE CREACIÓN DEL DOM -------------------');
        console.log(' ');

        //BUSCO LOS ELEMENTOS TR PARA BUSCAR QUE CORRESPONDEN A LAS PREGUNTAS
        let nuevo_listado = oDOM.getElementsByTagName('tr');

        //BUSCO EL ÚLTIMO ELEMENTO TR PARA OBTENER LOS DATOS DE LA ULTIMA PREGUNTA INSERTADA
        let ultima_pregunta = nuevo_listado[(nuevo_listado.length-1)];
        
        //NAVEGO POR EL DOM DE LA ÚLTIMA PREGUNTA PARA EXTRAER SÓLO EL TEXTO DE LA PREGUNTA
        let elementos_ultima_pregunta = ultima_pregunta.childNodes;        
        let pregunta_ultima_pregunta = elementos_ultima_pregunta[3].childNodes;
        let pregunta_ultima_pregunta_1 = pregunta_ultima_pregunta[0].childNodes;
        
        //VERIFICO QUE LA PREGUNTA SEA IGUALK A LA PREGUNTA DE PRUEBA INSERTADA
        pregunta_ultima_pregunta_1.toString().should.equal('Pregunta de prueba 111');

        //SE IMPRIME POR PANTALLA EL ID DE LA ÚLTIMA PREGUNTA, LA ULTIMA PREGUNTA Y SU DOM
        console.log(' ');
        console.log('     ID de la ÚLTIMA PREGUNTA INSERTADA: ' + elementos_ultima_pregunta[1].childNodes[0].toString());
        console.log('     ULTIMA PREGUNTA INSERTADA: ' + pregunta_ultima_pregunta_1.toString());
        console.log('     DOM DE LA ULTIMA PREGUNTA INSERTADA: ' + elementos_ultima_pregunta[3].toString());
        console.log(' ')

        //SE ASIGNA EL ID DE LA ÚLTIMA PREGUNTA PARA PODER BORRARLA SELECCIONANDO EL BOTON
        ID_pregunta_prueba = Number(elementos_ultima_pregunta[1].childNodes[0].toString());
        
        //DOM COMPLETO DE LA ÚLTIMA PREGUNTA PARA EFECTOS DE LA DEPURACION
        //console.log(nuevo_listado[(nuevo_listado.length-1)].toString());
        
        //NODOS HIJO DEL DOM DE LA ÚLTIMA PREGUNTA PARA EFECTOS DE DEPURACIÓN
        //console.log(ultima_pregunta.childNodes.toString());
    });

});



describe('## GRUPO 3: TEST UNITARIOS USANDO ZOMBIE - PRUEBA DE ELIMINACIÓN DE REGISTRO CREADO ', function(){

    const browser = new Browser();


    before (function (){ console.log(' '); return browser.visit("http://localhost:8000/quizzes");});
    //after (function (){ console.log(' -After test group 3')});

        //Test unitario 9 para borrar la pregunta de prueba y verificar el borrado de elementos
        it('TEST 7 - BUSCA EL BOTON PARA ELIMINAR LA ÚLTIMA PREGUNTA CREADA - FUNC: ACCESO A BD', function() {
            //return browser.pressButton(`Delete${ID_pregunta_prueba}`);
            return browser.clickLink(`Delete ID: ${ID_pregunta_prueba}`);
        });

        it('TEST 8 - PULSA ENTER PARA PASAR EL ALERT',function() {
            return ke;
        });

        it(`TEST 9 - VERIFICO LA ELIMINACIÓN DE LA ULTIMA PREGUNTA - FUNC: ACCESO A BD`,function() {
        

        //CAPTURO EL HTML COMPLETO
        let html = browser.html();

        console.log(' ');
        console.log('----------------- INFORMACIÓN TECNICA DE CREACIÓN DEL DOM -------------------');

        //GENERO EL DOM PARA PODER BUSCAR LOS ELEMENTOS USANDO DOMPARSER
        let codigo = new DOMParser();
        let oDOM = codigo.parseFromString(html, "text/xml");
        console.log('----------------- INFORMACIÓN TECNICA DE CREACIÓN DEL DOM -------------------');
        console.log(' ');

        //BUSCO LOS ELEMENTOS TR PARA BUSCAR QUE CORRESPONDEN A LAS PREGUNTAS
        let nuevo_listado = oDOM.getElementsByTagName('tr');

        //BUSCO EL ÚLTIMO ELEMENTO TR PARA OBTENER LOS DATOS DE LA ULTIMA PREGUNTA INSERTADA
        let ultima_pregunta = nuevo_listado[(nuevo_listado.length-1)];



        //NAVEGO POR EL DOM DE LA ÚLTIMA PREGUNTA PARA EXTRAER SÓLO EL TEXTO DE LA PREGUNTA
        let elementos_ultima_pregunta = ultima_pregunta.childNodes;        
        //let pregunta_ultima_pregunta = elementos_ultima_pregunta[3].childNodes;
        //let pregunta_ultima_pregunta_1 = pregunta_ultima_pregunta[0].childNodes;

        //SE ASIGNA EL ID DE LA ÚLTIMA PREGUNTA PARA PODER BORRARLA SELECCIONANDO EL BOTON
        ID_ultima_pregunta = Number(elementos_ultima_pregunta[1].childNodes[0].toString());
        
        //VERIFICO QUE EL ID DE LA ULTIMA PREGUNTA SEA IGUAL A LA PREGUNTA DE PRUEBA INSERTADA Y BORRADA
        ID_ultima_pregunta.toString().should.not.equal(ID_pregunta_prueba);


    });


});
