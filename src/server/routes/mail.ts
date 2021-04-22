import {Router} from 'express';
import {AppConfig} from '../config';

module.exports = (APP_CONFIG: AppConfig) => {
    const router = Router();
    const mail = APP_CONFIG.MailService;

    router.get('/', (req, res) => {
        mail.getAllMail(req.query['page'])
        .subscribe(
            results => res.send(results),
            err => res.status(500).send(err)
        );
    });

    router.get('/:emailId', (req, res) => {
        mail.getMail(Number(req.params['emailId']))
        .subscribe(
            results => res.send(results),
            err => {
                if (err === 404) {
                    return res.status(404).send('Could not find email');
                }
                res.status(500).send(err);
            }
        );
    });

    router.get('/:emailId/contents', (req, res) => {
        mail.getMail(Number(req.params['emailId']))
        .subscribe(
            result => res.send(result.html),
            err => {
                if (err === 404) {
                    return res.status(404).send('Could not find email');
                }
                res.status(500).send(err);
            }
        );
    });

    return router;
};
