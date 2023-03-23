import express, { Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
app.use(cors());

// Swagger dokumentáció beolvasása
const swaggerDocument = YAML.load('./swagger.yaml');

// Middleware a kérés feldolgozására
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Swagger UI szolgáltatás az API dokumentációhoz
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Tömb a titkok tárolására
const secrets: any[] = [];

// Végpont a titok hozzáadására
app.post('/v1/secret', (req: Request, res: Response) => {
    // Felvesszük a titok adatait
    const { secret, expireAfterViews, expireAfter } = req.body;

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Létrehozzuk a titok objektumot, beállítjuk a titokot és a lejárati időt, ha van
    const secretObject = {
        hash: result,
        secretText: secret,
        createdAt: new Date(),
        expiresAt: expireAfter > 0 ? new Date(Date.now() + expireAfter * 60 * 1000) : null,
        remainingViews: expireAfterViews,
    };
    // Hozzáadjuk a titok objektumot a tömbhöz
    secrets.push(secretObject);
    // Visszaadjuk a titok objektumot
    res.json(secretObject);
});
app.get('/v1/secret/:hash', (req: Request, res: Response) => {
    // Felvesszük a hash értékét a végpontból
    const { hash } = req.params;

    // Megkeressük a megfelelő titok objektumot a tömbben
    const secretObject = secrets.find((secret) => secret.hash === hash);

    // Ha nincs ilyen titok, vagy lejárt az ideje, akkor 404-es hibaüzenetet küldünk vissza
    if (!secretObject || (secretObject.expiresAt && secretObject.expiresAt < new Date())) {
        res.status(404).json({ message: 'Titok nem található' });
    } else if (secretObject.remainingViews <= 0) {
        // Ha elfogyott a megtekintési lehetőségek száma, akkor is 404-es hibaüzenetet küldünk vissza
        res.status(404).json({ message: 'Nincs több megtekintési lehetőség' });
    } else {
        // Csökkentjük a megtekintési lehetőségek számát
        secretObject.remainingViews--;
        // Visszaadjuk a titok objektumot
        res.json(secretObject);
    }
});


// Indítjuk az alkalmazást a megadott porton
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});  