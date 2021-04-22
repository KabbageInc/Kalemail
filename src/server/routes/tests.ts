import {Router} from 'express';
import {AppConfig} from '../config';
import {EmailOnAcidService} from '../services/emailonacid';
import {Observable} from 'rxjs/Rx';
import {TestResult} from '../models/tests';

module.exports = (APP_CONFIG: AppConfig) => {
    const router = Router();
    const mail = APP_CONFIG.MailService;
    const db = APP_CONFIG.Database;
    const eoakey = APP_CONFIG.EnvironmentConfig.emailOnAcidApiKey;
    const eoapass = APP_CONFIG.EnvironmentConfig.emailOnAcidPass;
    const eoa = new EmailOnAcidService(eoakey, eoapass);

    const testCache: {[emailId: string]: {value: string, exp: number}} = {};
    const resultCache: {[testId: string]: {value: TestResult[], exp: number}} = {};

    router.use((req, res, next) => {
        if (!eoakey || !eoakey.length) {
            return res.status(412).send('No Email on Acid key is provided, so we cannot test emails');
        } else {
            return next();
        }
    });

    router.post('/:emailId', (req, res) => {
        const mailId = req.params['emailId'];
        const now = new Date().getTime();
        if (mailId in testCache && testCache[mailId].exp > now) {
            return res.header('Content-Type', 'text/plain').send(testCache[mailId].value);
        }
        mail.getMail(Number(mailId))
        .flatMap(email => eoa.createTest(email))
        .flatMap(
            testId => db.query('Update `emails` SET `LastTestId`=? Where `EmailId`=?', [testId, mailId])
            .catch(_ => Observable.of(undefined))
            .map(_ => testId)
        )
        .do(testId => testCache[mailId] = {value: testId, exp: now + (5 * 60 * 1000)}) // 5 minute cache
        .subscribe(
            testId => res.header('Content-Type', 'text/plain').send(testId),
            error => res.status(500).send('Could not create test')
        );
    });

    router.get('/:testId', (req, res) => {
        const testId = req.params['testId'];
        const now = new Date().getTime();
        if (testId in resultCache && resultCache[testId].exp > now) {
            return res.send(resultCache[testId].value);
        } else {
            eoa.getTestResults(testId)
            .do(results => {
                resultCache[testId] = {value: results, exp: now + (60000)}; // 1 minute results cache
            })
            .subscribe(
                results => res.send(results),
                err => res.send(err)
            );
        }
    });

    return router;
};
