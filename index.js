const http = require('http');
const validator = require('validator');
const con = require('./Database/MySQL');

http.createServer(function (req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Request-Method', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    switch(req.method){
        case "GET":
            switch(req.url) {
                case "/":
                    res.writeHead(200, {'Content-Type': 'text/plain'});
                    res.write("Seja bem vindo!");
                    res.end();
                    break;
                case "/lancamentos_all":
                    //TODO: Criar Streaming;

                    doSomething("SELECT * from lancamento")
                        .then(results => {
                            res.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
                            res.write(JSON.stringify(results));
                            res.end();
                        })
                        .catch(e => {
                            throw e;
                        })


                    break;
                case "/categorias_all":
                    doSomething("SELECT * from categoria")
                        .then(results => {
                            res.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
                            res.write(JSON.stringify(results));
                            res.end();
                        })
                        .catch(e => {
                            throw e;
                        })
                    break;
                case "/meioPagamentos_all":
                    doSomething("SELECT * from meio_pagamento")
                        .then(results => {
                            res.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
                            res.write(JSON.stringify(results));
                            res.end();
                        })
                        .catch(e => {
                            throw e;
                        })
                    break;
                default: {
                    if(req.url.includes("/fontesDinheiro/",0)){
                        const userId = req.url.substring(16);
                        if(!isNaN(userId)) {
                            doSomething("SELECT * from fonte_dinheiro WHERE user_id = "+userId)
                                .then(results => {
                                    res.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
                                    res.write(JSON.stringify(results));
                                    res.end();
                                })
                                .catch(e => {
                                    throw e;
                                })
                        }
                    }
                    else if (req.url.includes("/lancamentos?",0)) {
                        const params = reqParams(req.url);
                        if(params) {
                            const sql = sqlParams(params);
                            doSomething(`SELECT * from lancamento WHERE ${sql};`)
                                .then(results => {
                                    res.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
                                    // console.log(results);
                                    res.write(JSON.stringify(results));
                                    res.end();
                                })
                                .catch(e => {
                                    throw e;
                                })
                        }
                    }
                }
                    //TODO: Aprender REGEX para fazer o caso do FonteDinheiro
            }
            break;
        case "POST":

            switch(req.url) {

                case "/":
                    res.writeHead(200, {'Content-Type': 'text/plain'});
                    res.write("OK");
                    res.end();
                    break;

                case "/novoLancamento":
                    req.on('data', (dado) => {
                        let params = JSON.parse(dado.toString('utf8'));
                        const headValues = getHeaderAndValues("novoLancamento","novo",params,res);

                        console.log(`INSERT INTO lancamento ${headValues[0]} VALUES ${headValues[1]}`);
                        doSomething(`INSERT INTO lancamento ${headValues[0]} VALUES ${headValues[1]}`)
                            .then(() => {
                                if(params.fixo == 1) {
                                    doSomething("SELECT `AUTO_INCREMENT` FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'minhascontas' AND TABLE_NAME = 'lancamento';")
                                        .then((response)=> {
                                            let ai = Number(JSON.parse(JSON.stringify(response))[0].AUTO_INCREMENT)-1;
                                            console.log(`INSERT INTO fixo(tsc_id,status) VALUES ('${ai}','1');`);
                                            dml(`INSERT INTO fixo(tsc_id,status) VALUES ('${ai}','1');`,res);
                                        })
                                        .catch((e) => {
                                            console.log(e);
                                        })
                                } else {
                                    res.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
                                    res.write("OK");res.end();
                                }
                            })
                            .catch((e) => {
                                console.log(e);
                            })
                    })
                    break;

                case "/editarLancamento":
                    req.on("data", (dado) => {
                        let params = JSON.parse(dado.toString('utf8'));

                        const headValues = getHeaderAndValues("novoLancamento","editar",params,res);

                        dml(`UPDATE lancamento SET ${headValues} WHERE tsc_id = ${params.tsc_id}`,res);
                    })
                    break;

                case "/editarFtdValor":
                    req.on("data", (dado) => {
                        let params = JSON.parse(dado.toString('utf8'));
                        dml(`UPDATE fonte_dinheiro SET valor = ${params.valor} WHERE ftd_id = ${params.ftd_id}`,res);
                    })
                    break;
            }

            break;
    }

}).listen(8082);

function doSomething(query) {
    return new Promise((resolve, reject) => {
        con.query(query, function (err, result, fields) {
            if (err) reject(err);
            resolve(result);
        });
    })
}

function verify(type,thing) {
    switch(type) {
        case "novoLancamento":
            try {
                if (isNaN(validator.toFloat(thing.valor + ''))) throw new Error("valorError");
                if (isNaN(validator.toInt(thing.user_id + ''))) throw new Error("user_idError");
                if (isNaN(validator.toInt(thing.cat_id + ''))) throw new Error("cat_idError");
                if (isNaN(validator.toInt(thing.ftd_id + ''))) throw new Error("ftd_idError");
                if (isNaN(validator.toInt(thing.mpg_id + ''))) throw new Error("mpg_idError");
                if (isNaN(validator.toInt(thing.a_pagar + ''))) throw new Error("a_pagarError");
                if (validator.toDate(thing.data_pag + '') == null) throw new Error("data_pagError");
                if (validator.toDate(thing.criacao + '') == null) throw new Error("criacaoError");
                thing.nome = validator.unescape(thing.nome + '');
                thing.comentario = validator.unescape(thing.comentario + '');
                thing.agente = validator.unescape(thing.agente + '');
                return true;
                break;
            } catch(e) {
                console.log(e);
            }
    }
}

function getHeaderAndValues(vfy,mount,params,res) {

    if(verify(vfy,params)){
        const attrs = ['user_id','nome','valor','a_pagar','data_pag','comentario','cat_id','ftd_id','agente','mpg_id','status','criacao'];
        switch(mount) {
            case "novo":
                let header = `(${attrs[0]}`, value = `('${params[attrs[0]]}'`;
                for(let i = 1; i < attrs.length; i++) {
                    header += `,${attrs[i]}`;
                    value += `,'${params[attrs[i]]}'`;
                }
                header += `)`;
                value += `)`;
                return [header,value];
                break;
            case "editar":
                let sentence = `${attrs[0]} = '${params[attrs[0]]}'`;
                for(let i = 1; i < attrs.length; i++) {
                    sentence += `, ${attrs[i]} = '${params[attrs[i]]}'`;
                }
                return sentence;
                break;
        }



    } else {
        res.writeHead(400, {'Content-Type': 'text/plain'});
        res.write("Parâmetros enviados são inválidos");
        res.end();
        return false;
    }
}

function dml(query,res) {

    doSomething(query)
        .then(results => {
            res.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
            res.write("OK");res.end();
        })
        .catch(e => {
            console.log(e);
        })
}

function reqParams (url){
    let q = url.split('?'),result={};
    if(q.length>=2){
        q[1].split('&').forEach((item)=>{
            try {
                result[item.split('=')[0]]=item.split('=')[1];
            } catch (e) {
                result[item.split('=')[0]]='';
            }
        });
        return result;
    }
    return false;
}

function sqlParams (obj) {
    const attrs = ['user_id','nome','valorIni','valorFim','a_pagar','data_pagIni','data_pagFim','comentario','cat_id','ftd_id','agente','mpg_id','status'];
    let where = "";

    if(typeof obj !== "object") return false;

    let keys = Object.keys(obj);

    if(keys.length === 0) {return false;}

    for (let i = 0; i < keys.length; i++) {
        if(i>0) {
            where += " AND ";
        }
        if(attrs.includes(keys[i])) {
            switch (keys[i]) {
                case "nome":
                case "comentario":
                case "agente":
                    where += `${keys[i]} LIKE '${obj[keys[i]]}%'`;
                    break;
                case "valorIni":
                case "data_pagIni":
                    where += `${keys[i].replace("Ini","")} >= '${obj[keys[i]]}'`;
                    break;
                case "valorFim":
                case "data_pagFim":
                    where += `${keys[i].replace("Fim","")} <= '${obj[keys[i]]}'`;
                    break;
                default:
                    where += `${keys[i]} = '${obj[keys[i]]}'`;
                    break;
            }

        }
    }

    return where;
}
