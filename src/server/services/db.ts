import {Observable} from 'rxjs/Rx';
import {createPool, IPoolConfig, Pool, escape as mysqlEscape} from 'mysql';

const NUMPERPAGE = 50;

export class DatabaseService {
    private pool: Pool;

    constructor(config?: IPoolConfig) {
        let poolconfig = Object.assign({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            database: process.env.DB_DATABASE || 'kalemail',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'admin',
            charset: 'utf8mb4' // allow emojis
        }, config || {});

        this.pool = createPool(poolconfig);
    }

    public query(q, params?): Observable<any> {
        return Observable.create(observer => {
            this.pool.getConnection((err, conn) => {
                if (err) {
                    if (conn && conn.release) {
                        conn.release();
                    }
                    return observer.error(err);
                }
                conn.query(q, params || [], (error, result) => {
                    conn.release();
                    if (error) {
                        return observer.error(error);
                    }
                    observer.next(result);
                    observer.complete();
                });
            });
        });
    }

    public escape(value) {
        return mysqlEscape(value);
    }

    public generatePageQuery(pageNum: number) {
        // We want to get the 1 more than page length, and hide it locally to decide if there is a next page
        return ` LIMIT ${Math.max(pageNum - 1, 0) * NUMPERPAGE}, ${NUMPERPAGE + 1}`;
    }
}
