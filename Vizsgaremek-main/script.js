const express = require('express');
const mysql = require('mysql2'); // Hiányzott a MySQL modul importálása

const app = express();
const port = 3000;

app.use(express.json()); // Beépített middleware JSON kérések kezelésére

// MySQL kapcsolat beállítása
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      // A MySQL felhasználóneved
    port: 3306,        // MySQL port
    password: '',      // A MySQL jelszavad
    database: 'magantanar'
});

db.connect(err => {
    if (err) {
        console.error('Hiba a MySQL adatbázishoz való kapcsolódás során: ' + err.stack);
        return;
    }
    console.log('Kapcsolódás sikeres a MySQL adatbázishoz.');
});

// Egyszerűsített és újrafelhasználható endpoint lekérdezések
// Alapértelmezett tanárok listázása
app.get('/magantanar', (req, res) => {
    db.query('SELECT * FROM magantanar', (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Hiba a tanárok listázásakor' });
        }
        res.json(results);
    });
});

// Egyedi azonosítóra történő lekérdezés
app.get('/magantanar/:id', (req, res) => {
    const id = req.params.id; // Dinamikus paraméter az URL-ből
    db.query('SELECT * FROM magantanar WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Hiba a tanár adatainak lekérésekor' });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: 'Nincs ilyen ID-vel rendelkező tanár' });
        }
        res.json(result[0]); // Egyedi adat visszaadása
    });
});

// Tanár keresés különböző szempontok szerint
// Példa: /magantanar/kereso?tantargy=matek&varos=Budapest
app.get('/magantanar/kereso', (req, res) => {
    const { tantargy, varos, nem } = req.query; // Query paraméterek
    let query = 'SELECT * FROM magantanar WHERE 1=1'; // Alapértelmezett lekérdezés
    const params = [];

    if (tantargy) {
        query += ' AND tantargy = ?';
        params.push(tantargy);
    }
    if (varos) {
        query += ' AND varos = ?';
        params.push(varos);
    }
    if (nem) {
        query += ' AND nem = ?';
        params.push(nem);
    }

    db.query(query, params, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Hiba a keresés során' });
        }
        res.json(results);
    });
});

// Regisztráció és bejelentkezés (helykitöltő példa)
app.post('/magantanar/regisztracio', (req, res) => {
    const { nev, tantargy, varos, nem } = req.body;

    if (!nev || !tantargy || !varos || !nem) {
        return res.status(400).json({ error: 'Hiányzó adat(ok): név, tantárgy, város, nem kötelező!' });
    }

    db.query(
        'INSERT INTO magantanar (nev, tantargy, varos, nem) VALUES (?, ?, ?, ?)',
        [nev, tantargy, varos, nem],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Hiba a regisztráció során' });
            }
            res.status(201).json({ message: 'Sikeres regisztráció', tanarId: result.insertId });
        }
    );
});

// Bejelentkezés (csak helykitöltő logika)
app.post('/magantanar/bejelentkezes', (req, res) => {
    const { nev } = req.body;

    if (!nev) {
        return res.status(400).json({ error: 'Név megadása kötelező' });
    }

    db.query('SELECT * FROM magantanar WHERE nev = ?', [nev], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Hiba a bejelentkezés során' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Nincs ilyen névvel rendelkező tanár' });
        }
        res.json({ message: 'Sikeres bejelentkezés', tanar: results[0] });
    });
});

// Alkalmazás indítása
app.listen(port, () => {
    console.log(`API elérhető a http://localhost:${port}`);
});
