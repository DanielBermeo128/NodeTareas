const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const { createDeflate } = require('zlib');

const app = express();

// Configuración para el uso de peticiones POST
app.use(bodyParser.urlencoded({ extended: false }));

// Configuración de plantillas dinámicas
app.set('view engine', 'ejs');

// Crear la conexión
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // tu usuario de MySQL
    password: '1234', // tu contraseña de MySQL
    database: 'Pendientes', // nombre de la base de datos
    port: 3306
});

// Comprobación de la conexión a la base de datos
db.connect(err => {
    if (err) {
        console.error('Error conectando a la base de datos:', err);
    } else {
        console.log('Conectado a la base de datos MySQL');
    }
});

// Iniciar el servidor
const port = 3009;
app.listen(port, () => {
    console.log(`Servidor en funcionamiento desde http://localhost:${port}`);
});

// Rutas

// Página principal
app.get('/', (req, res) => {
    const query = `
        SELECT t.id, t.titulo, t.dependencia, 
               t.fecha_llegada, 
               t.fecha_limite,
               ci.tipo_importancia AS importancia, 
               cu.nivel_urgencia AS urgencia, 
               ce.estado 
        FROM tareas t
        JOIN catalogo_importancia ci ON t.importancia_id = ci.id
        JOIN catalogo_urgencia cu ON t.urgencia_id = cu.id
        JOIN catalogo_estado ce ON t.estado_id = ce.id
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener las tareas:', err);
            res.send('Error');
        } else {
            // Convertir las fechas a formato yyyy-mm-dd
            results.forEach(tarea => {
                // Convertir fecha_llegada
                if (tarea.fecha_llegada) {
                    const llegada = new Date(tarea.fecha_llegada);
                    tarea.fecha_llegada = llegada.toISOString().split('T')[0]; // formato yyyy-mm-dd
                }

                // Convertir fecha_limite
                if (tarea.fecha_limite) {
                    const limite = new Date(tarea.fecha_limite);
                    tarea.fecha_limite = limite.toISOString().split('T')[0]; // formato yyyy-mm-dd
                }
            });

            res.render('index', { tareas: results });
        }
    });
});


// Formulario para crear una nueva tarea
app.get('/tareas/nueva', (req, res) => {
    let importancia = [];
    let urgencia = [];
    let estado = [];

    // Consultar catálogo de importancia
    db.query('SELECT * FROM catalogo_importancia', (err, importanciaResults) => {
        if (err) {
            console.error('Error al cargar el catálogo de importancia:', err);
            return res.send('Error al cargar el catálogo de importancia');
        }
        importancia = importanciaResults;

        // Consultar catálogo de urgencia
        db.query('SELECT * FROM catalogo_urgencia', (err, urgenciaResults) => {
            if (err) {
                console.error('Error al cargar el catálogo de urgencia:', err);
                return res.send('Error al cargar el catálogo de urgencia');
            }
            urgencia = urgenciaResults;

            // Consultar catálogo de estado
            db.query('SELECT * FROM catalogo_estado', (err, estadoResults) => {
                if (err) {
                    console.error('Error al cargar el catálogo de estado:', err);
                    return res.send('Error al cargar el catálogo de estado');
                }
                estado = estadoResults;

                // Renderizar el formulario con los datos de los catálogos
                res.render('formulario', { tarea: null, importancia, urgencia, estado });
            });
        });
    });
});


// Crear una nueva tarea
app.post('/tareas/nueva', (req, res) => {
    const { titulo, importancia_id, urgencia_id, dependencia, fecha_llegada, fecha_limite, estado_id } = req.body;
    const query = `
        INSERT INTO tareas (titulo, importancia_id, urgencia_id, dependencia, fecha_llegada, fecha_limite, estado_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(query, [titulo, importancia_id, urgencia_id, dependencia, fecha_llegada, fecha_limite, estado_id], (err) => {
        if (err) {
            console.error('Error al crear la tarea:', err);
            res.send('Error');
        } else {
            res.redirect('/');
        }
    });
});

// Formulario para editar una tarea existente
app.get('/tareas/editar/:id', (req, res) => {
    const { id } = req.params;

    // Consulta de la tarea
    const tareaQuery = 'SELECT * FROM tareas WHERE id = ?';
    db.query(tareaQuery, [id], (err, tareaResults) => {
        if (err) {
            console.error('Error al obtener la tarea:', err);
            res.send('Error');
        } else {
            const tarea = tareaResults[0];

            // Convertir las fechas de la tarea a formato yyyy-mm-dd
            if (tarea.fecha_llegada) {
                const llegada = new Date(tarea.fecha_llegada);
                tarea.fecha_llegada = llegada.toISOString().split('T')[0]; // formato yyyy-mm-dd
            }

            if (tarea.fecha_limite) {
                const limite = new Date(tarea.fecha_limite);
                tarea.fecha_limite = limite.toISOString().split('T')[0]; // formato yyyy-mm-dd
            }

            // Consultas para los catálogos
            const importanciaQuery = 'SELECT * FROM catalogo_importancia';
            const urgenciaQuery = 'SELECT * FROM catalogo_urgencia';
            const estadoQuery = 'SELECT * FROM catalogo_estado';

            db.query(importanciaQuery, (err, importanciaResults) => {
                if (err) {
                    console.error('Error al obtener el catálogo de importancia:', err);
                    res.send('Error');
                } else {
                    db.query(urgenciaQuery, (err, urgenciaResults) => {
                        if (err) {
                            console.error('Error al obtener el catálogo de urgencia:', err);
                            res.send('Error');
                        } else {
                            db.query(estadoQuery, (err, estadoResults) => {
                                if (err) {
                                    console.error('Error al obtener el catálogo de estado:', err);
                                    res.send('Error');
                                } else {
                                    // Renderizar el formulario con la tarea y los catálogos
                                    res.render('formulario', {
                                        tarea,
                                        importancia: importanciaResults,
                                        urgencia: urgenciaResults,
                                        estado: estadoResults
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});






// Editar una tarea existente
app.post('/tareas/editar/:id', (req, res) => {
    const { id } = req.params;
    const { titulo, importancia_id, urgencia_id, dependencia, fecha_llegada, fecha_limite, estado_id } = req.body;
    const query = `
        UPDATE tareas
        SET titulo = ?, importancia_id = ?, urgencia_id = ?, dependencia = ?, fecha_llegada = ?, fecha_limite = ?, estado_id = ?
        WHERE id = ?
    `;
    db.query(query, [titulo, importancia_id, urgencia_id, dependencia, fecha_llegada, fecha_limite, estado_id, id], (err) => {
        if (err) {
            console.error('Error al editar la tarea:', err);
            res.send('Error');
        } else {
            res.redirect('/');
        }
    });
});

// Eliminar una tarea
app.get('/tareas/eliminar/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM tareas WHERE id = ?';
    db.query(query, [id], (err) => {
        if (err) {
            console.error('Error al eliminar la tarea:', err);
            res.send('Error');
        } else {
            res.redirect('/');
        }
    });
});
