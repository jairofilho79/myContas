
const apiUrl = "http://192.168.0.6:8082/";
let lancamentosLista = [];
let CategoriaLista = {};
let FonteDinLista = {};
let MeioPagLista = {};
let strPesquisa = "?status=0";

let userId = 1;

const tabsHome = new Tabs({elem: "tabsHome", open: 0});

// function homeButton() {getLancs(strPesquisa);}

window.onload = function() {
    getJson("categorias_all").then(result => {for(let i=0; i<result.length; i++) {CategoriaLista[result[i].cat_id] = result[i].nome;}});
    getJson("meioPagamentos_all").then(result => {for(let i=0; i<result.length; i++) {MeioPagLista[result[i].mpg_id] = result[i].nome;}});
    atualizarFontesDin();
    getLancs("?status=0");

    Snackbar("Seja bem-vindo!","success");
}

document.addEventListener("DOMContentLoaded", function(event) {
    document.getElementById("pesquisarLanc").addEventListener("click", function(event) {pesquisarLanc(); closeOffCanvas()});
    document.getElementById("novoLanc").addEventListener("click", function(event) {novoLanc(); closeOffCanvas()});
    document.getElementById("simulacao").addEventListener("click", function(event) {simulacao(); closeOffCanvas()});

    document.getElementById("funcionalidades").addEventListener("click", function(event) {
        document.getElementById("mySidenav").style.width = "250px";
        document.getElementById("app").style.marginLeft = "250px";
        document.getElementById("app").addEventListener("click", closeOffCanvas);
    });
    document.getElementsByClassName("closebtn")[0].addEventListener("click", closeOffCanvas);

});

function closeOffCanvas() {
    document.getElementById("mySidenav").style.width = "0";
    document.getElementById("app").style.marginLeft = "0";
    document.getElementById("app").removeEventListener("click",closeOffCanvas)
}

let ids = ['nome','agente'];
let idsPesc = ['valorIni','valorFim','data_pagIni','data_pagFim'];
let idsLanc = ['valor','data_pag','comentario'];
let names = ['status','a_pagar','cat_id','ftd_id','mpg_id'];
let novoLancObj = {};

//Funções Principais (manipulam dados)

function pagar(i) {
    lancamentosLista[i].status = 1;
    lancamentosLista[i].data_pag = moment(lancamentosLista[i].data_pag,"YYYY-MM-DD").format("YYYY-MM-DD");
    lancamentosLista[i].criacao = moment(lancamentosLista[i].criacao,"YYYY-MM-DD").format("YYYY-MM-DD");

    fetch(apiUrl+"editarLancamento",{method: "POST", body: JSON.stringify(lancamentosLista[i])})
        .catch(e => {console.log(e); Snackbar("Pagamento feito com falha!","danger");})
        .then(response => response.text())
        .then(() => {
            Snackbar("Pagamento feito com sucesso!","success");
            getLancs(strPesquisa);
            new Promise((res,rej) => {setFontesDin(FonteDinLista[lancamentosLista[i].ftd_id].valor + Number(lancamentosLista[i].a_pagar ? lancamentosLista[i].valor*-1 : lancamentosLista[i].valor),lancamentosLista[i].ftd_id,res,rej)})
                .then(() => {Snackbar("Pagamento feito com sucesso e creditado!","success");})
                .catch(() => {Snackbar("Pagamento feito com sucesso mas não creditado!","warning");})
        }).catch(e => {console.log(e); Snackbar("Pagamento feito com falha!","danger");});
}

function moreInfo(i) {
    const modal = new tingle.modal({
        footer: true,
        onClose: function () {
            modal.destroy();
        }
    });

    modal.setContent(`
        <h1 class="header">Mais informações</h1>

        <div class="row">
          <div class="column"><strong>Nome</strong></div>
          <div class="column">${lancamentosLista[i].nome}</div>
        </div>
        
        <hr>
        
        <div class="row">
          <div class="column"><strong>Valor</strong></div>
          <div class="column">${formatter("money-br",lancamentosLista[i].valor)}</div>
        </div>
        
        <hr>
        
        <div class="row">
          <div class="column"><strong>Comentário</strong></div>
          <div class="column">${lancamentosLista[i].comentario ? lancamentosLista[i].comentario : "Não há comentários."}</div>
        </div>
        
        <hr>
        
        <div class="row">
          <div class="column"><strong>Data de Pagamento</strong></div>
          <div class="column">${formatter("date-br",lancamentosLista[i].data_pag)}</div>
        </div>
        
        <hr>
        
        <div class="row">
          <div class="column"><strong>Status</strong></div>
          <div class="column">${lancamentosLista[i].status == "0" ? "Não Pago" : "Pago"}</div>
        </div>
        
        <hr>
        
        <div class="row">
          <div class="column"><strong>Tipo</strong></div>
          <div class="column">${lancamentosLista[i].a_pagar == "0" ? "Receita" : "Custo"}</div>
        </div>
        
        <hr>
        
        <div class="row">
          <div class="column"><strong>Categoria</strong></div>
          <div class="column">${CategoriaLista[lancamentosLista[i].cat_id]}</div>
        </div>
        
        <hr>
        
        <div class="row">
          <div class="column"><strong>Fonte do Dinheiro</strong></div>
          <div class="column">${FonteDinLista[lancamentosLista[i].ftd_id].nome}</div>
        </div>
        
        <hr>
        
        <div class="row">
          <div class="column"><strong>Meio de Pagamento</strong></div>
          <div class="column">${MeioPagLista[lancamentosLista[i].mpg_id]}</div>
        </div>
        <hr>
        
        <div class="row">
          <div class="column"><strong>Agente</strong></div>
          <div class="column">${lancamentosLista[i].agente}</div>
        </div>
    `);

    modal.addFooterBtn('Editar', 'tingle-btn tingle-btn--primary', function() {
        editarLanc(i);
        modal.close();
    });

    modal.open();
}

function editarLanc(i) {console.log("editar");}

function pesquisarLanc() {
    const modal = new tingle.modal({
        footer: true,
        onClose() {
            modal.destroy();
        }
    });
    let html = `

    <h1 class="header">Pesquisar Lançamento</h1>
    <div class="clearfix">
 
    <form id="searchForm">
        <div class="row">
            <label for="nome">Nome:</label>
            <input type="text" class="t-right" id="nome">
        </div>
        <div class="row">
            <label for="agente">Agente:</label>
            <input type="text" class="t-right"" id="agente">
        </div>
        <div class="row">
            <label for="valorIni">Valor Inicial:</label>
            <input type="number" class="t-right" id="valorIni">
        </div>
        
        <div class="row">
            <label for="valorFim">Valor Final:</label>
            <input type="number" step="0.01" class="t-right" id="valorFim">
        </div>
        
        <div class="row">
            <label for="data_pagIni">Data de Pagamento Inicial:</label>
            <input type="date" class="t-right" id="data_pagIni">
        </div>
            
        <div class="row">
            <label for="data_pagFim">Data de Pagamento Final:</label>
            <input type="date" step="0.01" class="t-right" id="data_pagFim">
        </div>
        
        
            <label for="status">Status:</label>
            <ul class="ulOptions">
                <li><input type="radio" name="status" id="status" value="1"> Pago</li>
                <li><input type="radio" name="status" id="status" value="0"> Não Pago</li>
            </ul>
        
        
        
            <label for="a_pagar">Tipo:</label>
                <ul class="ulOptions">
                    <li><input type="radio" name="a_pagar" id="a_pagar" value="0"> Receita</li>
                    <li><input type="radio" name="a_pagar" id="a_pagar" value="1"> Custo</li>
                </ul>
          
    `;

    html += `<label for="cat_id">Categoria:</label> <ul class="ulOptions">`;
    let keys;

    keys = Object.keys(CategoriaLista);
    for (let i = 0; i < keys.length; i++) {
        html += `<li><input type="radio" name="cat_id" id="cat_id" value="${keys[i]}"> ${CategoriaLista[keys[i]]}</li>`;
    }
    html += `</ul>`;

    keys = Object.keys(FonteDinLista);
    html += `<label for="ftd_id">Fonte do Dinheiro:</label> <ul class="ulOptions">`;
    for (let i = 0; i < keys.length; i++) {
        html += `<li><input type="radio" name="ftd_id" id="ftd_id" value="${keys[i]}"> ${FonteDinLista[keys[i]].nome}</li>`;
    }
    html += `</ul>`;

    keys = Object.keys(MeioPagLista);
    html += `<label for="mpg_id">Meio de Pagamento:</label> <ul class="ulOptions">`;
    for (let i = 0; i < keys.length; i++) {
        html += `<li><input type="radio" name="mpg_id" id="mpg_id" value="${keys[i]}"> ${MeioPagLista[keys[i]]}</li>`;
    }
    html += `</ul>`;

    html += `
    </form></div>`;

    modal.setContent(html);

    modal.addFooterBtn('Pesquisar', 'tingle-btn tingle-btn--primary', function() {
        let obj = {};
        for(let i = 0; i<ids.length; i++) {
            let id = document.getElementById(ids[i]);
            if((typeof id.value == "string" && id.value !== "")) obj[ids[i]] = id.value;
        }
        for(let i = 0; i<idsPesc.length; i++) {
            let id = document.getElementById(idsPesc[i]);
            if((typeof id.value == "string" && id.value !== "")) obj[idsPesc[i]] = id.value;
        }
        for(let i = 0; i<names.length; i++) {
            let name = document.forms[0].elements[names[i]];
            if(typeof name.value == "string" && name.value !== "") obj[names[i]] = name.value;
        }
        modal.close();
        const url = obj2url(obj);
        strPesquisa = url;
        getLancs(url);
    });
    modal.addFooterBtn('Limpar Campos', 'tingle-btn tingle-btn--primary', function() {
        document.getElementById("searchForm").reset();
    });
    modal.addFooterBtn('Pesquisar Tudo', 'tingle-btn tingle-btn--primary', function() {
        getLancs("_all");
        modal.close();
    });
    modal.open();
}

function novoLanc() {

    const modal = new tingle.modal({
        footer: true,
        onClose() {
            modal.destroy();
        }
    });

    let html = `
    <form id="lancForm">
        <div class="row">
            <label for="nome">*Nome:</label>
            <input type="text" class="t-right" id="nome">
        </div>
        <hr>
        <div class="row">
            <label for="agente">*Agente:</label>
            <input type="text" class="t-right" id="agente">
        </div>
        <hr>
        <div class="row">
            <label for="comentario">Comentário:</label>
            <input type="text" class="t-right" id="comentario">
        </div>
        <hr>  
        <div class="row">
            <label title="Este valor será dividido pelas parcelas." for="valor">*Valor Total:</label>
            <input type="number"  class="t-right" id="valor">
        </div>
        <hr>
        <div class="row">
            <label for="parcelas">*Parcelas:</label>
            <input type="number" min="1" step="1" value="1" class="t-right" id="parcelas">
        </div>
        <hr>  
        <label for="fixo">*O Lançamento é:</label>
        <ul class="ulOptions">
            <li><input type="radio" name="fixo" id="fixo" value="1">Fixo</li>
            <li><input type="radio" name="fixo" id="fixo" value="0" checked>Único</li>
        </ul>
        <hr>  
        <div class="row">
            <label for="data_pag">*Data de Pagamento:</label>
            <input type="date" value="YYYY-MM-DD" class="t-right" id="data_pag">
        </div>
        <hr>  
        <label for="status">*Status:</label>
        <ul class="ulOptions">
            <li><input type="radio" name="status" id="status" value="1"> Pago</li>
            <li><input type="radio" name="status" id="status" value="0" checked> Não Pago</li>
        </ul>
        <hr>
        <label for="a_pagar">*Tipo:</label>
        <ul class="ulOptions">
            <li><input type="radio" name="a_pagar" id="a_pagar" value="0"> Receita</li>
            <li><input type="radio" name="a_pagar" id="a_pagar" value="1" checked> Custo</li>
        </ul>
    `;

    html += `<hr><label for="cat_id">*Categoria:</label> <ul class="ulOptions">`;
    let keys;

    keys = Object.keys(CategoriaLista);
    for (let i = 0; i < keys.length; i++) {
        html += `<li><input type="radio" name="cat_id" id="cat_id" value="${keys[i]}" checked> ${CategoriaLista[keys[i]]}</li>`;
    }
    html += `</ul>`;

    keys = Object.keys(FonteDinLista);
    html += `<hr><label for="ftd_id">*Fonte do Dinheiro:</label> <ul class="ulOptions">`;
    for (let i = 0; i < keys.length; i++) {
        html += `<li><input type="radio" name="ftd_id" id="ftd_id" value="${keys[i]}" checked> ${FonteDinLista[keys[i]].nome}</li>`;
    }
    html += `</ul>`;

    keys = Object.keys(MeioPagLista);
    html += `<hr><label for="mpg_id">*Meio de Pagamento:</label> <ul class="ulOptions">`;
    for (let i = 0; i < keys.length; i++) {
        html += `<li><input type="radio" name="mpg_id" id="mpg_id" value="${keys[i]}" checked> ${MeioPagLista[keys[i]]}</li>`;
    }
    html += `</ul>`;

    html += `
    </form>`;

    modal.setContent(html);

    modal.addFooterBtn('Lançar', 'tingle-btn tingle-btn--primary', function() {

        for(let i = 0; i<ids.length; i++) {
            let id = document.getElementById(ids[i]);
            if((typeof id.value == "string" && id.value !== "")) { novoLancObj[ids[i]]=id.value; } else { Snackbar("Por favor, preencha o campo obrigatório!","warning"); id.focus(); return;}
        }
        for(let i = 0; i<idsLanc.length; i++) {
            let id = document.getElementById(idsLanc[i]);
            if((typeof id.value == "string" && id.value !== "") || (idsLanc[i] == "comentario")){novoLancObj[idsLanc[i]]=id.value; } else {Snackbar("Por favor, preencha o campo obrigatório!","warning"); id.focus(); return;}
        }
        for(let i = 0; i<names.length; i++) {
            let name = document.forms[0].elements[names[i]];
            if(typeof name.value == "string" && name.value !== "") { novoLancObj[names[i]]=name.value; } else {Snackbar("Por favor, preencha o campo obrigatório!","warning"); return;}
        }

        let parcelas = Number(document.getElementById("parcelas").value);
        if(parcelas < 1) {Snackbar("O número de parcelas deve ser maior que 1!","warning"); return;}
        if(parcelas-Math.floor(parcelas) !== 0) {Snackbar("O número de parcelas deve ser inteiro!","warning"); return;}

        let fixo = document.forms[0].elements["fixo"].value;
        if(parcelas > 1 && fixo == 1) {Snackbar("Para lançamento fixo o número de parcelas deve ser 1!","warning"); document.getElementById("parcelas").focus(); return;}
        if(novoLancObj.cat_id == 2 && fixo == 1) {Snackbar("Lançamento fixo não pode ser Empréstimo!","warning"); document.getElementById("cat_id").focus(); return;}

        modal.close();

        novoLancObj["user_id"] = userId;
        novoLancObj["criacao"] = moment().format("YYYY-MM-DD");
        novoLancObj["fixo"] = fixo;

        novoLancObj.valor /= parcelas;
        for(let i = 0; i < parcelas; i++) {

            new Promise((res,rej) => {setnovoLanc(novoLancObj,res,rej)})
                .then(() => {Snackbar("Pagamento feito com sucesso e creditado!","success");})
                .catch((e) => {if(e === 1){Snackbar("Pagamento feito com falha!","warning"); console.log("err");}
                                else if(e === 2) {Snackbar("Pagamento feito com sucesso mas não creditado!","warning"); console.log("err");}});

            if(novoLancObj.cat_id == 2) { //Tipo empréstimo;

                let obj = JSON.parse(JSON.stringify(novoLancObj));
                obj.status = 0; obj.a_pagar = Number(!obj.a_pagar);
                obj.data_pag = moment(moment(obj.data_pag,"YYYY-MM-DD").add(1,"month").calendar()).format("YYYY-MM-DD");

                new Promise((res,rej) => {setnovoLanc(obj,res,rej)})
                    .then(() => {Snackbar("Pagamento feito com sucesso e creditado!","success");})
                    .catch((e) => {if(e === 1){Snackbar("Pagamento feito com falha!","warning"); console.log("err");}
                    else if(e === 2) {Snackbar("Pagamento feito com sucesso mas não creditado!","warning"); console.log("err");}});
            }
        }
    });
    modal.addFooterBtn('Limpar Campos', 'tingle-btn tingle-btn--primary', function() {
        document.getElementById("lancForm").reset();
    });
    modal.open();
}

//Funções de Renderização
function setLanc() {
    const lancamentos = document.getElementById("lancamentos");
    lancamentos.innerHTML = "";
    if(lancamentosLista.length === 0) {
        lancamentos.setAttribute("style","text-align:center;");
        lancamentos.innerHTML = "<h1>Nada foi encontrado! :(</h1>";
    }

    for(let i=0;i<lancamentosLista.length;i++) {
        const elemento = document.createElement("div");
        elemento.innerHTML =
            `
                    <div class="tag tag-${lancamentosLista[i].a_pagar == "0" ? "success" : "danger"}">${lancamentosLista[i].status == "0" ? lancamentosLista[i].a_pagar == "0" ? "Receber" : "Pagar" : lancamentosLista[i].a_pagar == "0" ? "Recebido" : "Pago"}</div>
                        <div class="container">
                        <h4 style="text-align: center;"><b>${lancamentosLista[i].nome}</b></h4> 
                        <p>${formatter("money-br",lancamentosLista[i].valor)}</p> 
                        <p>${formatter("date-br",lancamentosLista[i].data_pag)}</p>
                        <button class="card-btn moreInfo" id="${i}">+ Info</button> 
                        ${lancamentosLista[i].status == 0 ? `<button class="card-btn pagar" id="${i}">Pagar</button>` : ``}
                        </div> 
                    </div>
               `;
        elemento.setAttribute("class","card");
        lancamentos.appendChild(elemento);
    }

    Array.from( document.getElementsByClassName("pagar")).forEach(function(element) {
        element.addEventListener('click', function() {
            pagar(this.id);
        });
    });

    Array.from( document.getElementsByClassName("moreInfo")).forEach(function(element) {
        element.addEventListener('click', function() {
            moreInfo(this.id);
        });
    });

    setEstatic();
    tabsHome.open(0);
}

function setEstatic()  {
    let html = "";
    let lancEstatics = {
        valorReceitaPagoC: 0,
        valorReceitaPago: 0,
        valorReceitaNPAgoC: 0,
        valorReceitaNPAgo: 0,
        valorCustoPagoC: 0,
        valorCustoPago: 0,
        valorCustoNPagoC: 0,
        valorCustoNPago: 0,
        dataInicial: '2099-12-31',
        dataFinal: '1970-01-01'
    };

    if(lancamentosLista.length !== 0) {
        for (let i = 0; i < lancamentosLista.length; i++) {
            if (lancamentosLista[i].status) {
                if (lancamentosLista[i].a_pagar) {
                    lancEstatics.valorCustoPago += lancamentosLista[i].valor;
                    lancEstatics.valorCustoPagoC++;
                } else {
                    lancEstatics.valorReceitaPago += lancamentosLista[i].valor;
                    lancEstatics.valorReceitaPagoC++;
                }
            } else {
                if (lancamentosLista[i].a_pagar) {
                    lancEstatics.valorCustoNPago += lancamentosLista[i].valor;
                    lancEstatics.valorCustoNPagoC++;
                } else {
                    lancEstatics.valorReceitaNPAgo += lancamentosLista[i].valor;
                    lancEstatics.valorReceitaNPAgoC++;
                }
            }
            if (moment(lancamentosLista[i].data_pag, "YYYY-MM-DD").format("YYYY-MM-DD") < moment(lancEstatics.dataInicial, "YYYY-MM-DD").format("YYYY-MM-DD")) lancEstatics.dataInicial = moment(lancamentosLista[i].data_pag).format("YYYY-MM-DD")
            if (moment(lancamentosLista[i].data_pag, "YYYY-MM-DD").format("YYYY-MM-DD") > moment(lancEstatics.dataFinal, "YYYY-MM-DD").format("YYYY-MM-DD")) lancEstatics.dataFinal = moment(lancamentosLista[i].data_pag).format("YYYY-MM-DD")
        }

        html = `
            <div class="row">
                <div class="column"><strong>Atributo</strong></div>
                <div class="column">Conteúdos</div>
            </div>
            
            <div class="row">
                <div class="column"><strong>Receita Paga</strong></div>
                <div class="column">${formatter("money-br",lancEstatics.valorReceitaPago)} <strong title="Nº de Lançamentos">[${lancEstatics.valorReceitaPagoC}]</strong></div>
            </div>
            
            <div class="row">
                <div class="column"><strong>Receita Não Paga</strong></div>
                <div class="column">${formatter("money-br",lancEstatics.valorReceitaNPAgo)} <strong title="Nº de Lançamentos">[${lancEstatics.valorReceitaNPAgoC}]</strong></div>
            </div>
            
            <div class="row">
                <div class="column"><strong>Custo Pago</strong></div>
                <div class="column">${formatter("money-br",lancEstatics.valorCustoPago)} <strong title="Nº de Lançamentos">[${lancEstatics.valorCustoPagoC}]</strong></div>
            </div>
            
            <div class="row">
                <div class="column"><strong>Custo Não Pago</strong></div>
                <div class="column">${formatter("money-br",lancEstatics.valorCustoNPago)} <strong title="Nº de Lançamentos">[${lancEstatics.valorCustoNPagoC}]</strong></div>
            </div>
            
            <div class="row">
                <div class="column"><strong>Data mais nova</strong></div>
                <div class="column">${formatter("date-br",lancEstatics.dataInicial)}</div>
            </div>
            
            <div class="row">
                <div class="column"><strong>Data mais antiga</strong></div>
                <div class="column">${formatter("date-br",lancEstatics.dataFinal)}</div>
            </div>
    `;
    } else {
        html = "<h1>Nada a mostrar! :(</h1>"
        document.getElementById("estatisticas").setAttribute("style","text-align:center;");
    }
    document.getElementById("estatisticas").innerHTML = html;
}

function atualizarFontesDin() {
    const main = document.getElementById("fonte_dinheiro");
    let html = ``,valorTotal = 0;
    getJson("fontesDinheiro/"+userId).then(result => {

        for(let i=0; i<result.length; i++) {
            valorTotal += result[i].valor;
            FonteDinLista[result[i].ftd_id] = {
                nome: result[i].nome,
                valor: result[i].valor
            };
            html += `<div>
                        <h3 id="${result[i].ftd_id}" class="btn_ftd_change_val" style="margin-top: 3%; cursor: pointer;">${result[i].nome} : ${formatter("money-br",result[i].valor)}</h3>
                    </div>`;
        }

        html += `<hr/><div><h2>Valor Total : ${formatter("money-br",valorTotal)}</h2></div>`;

        main.innerHTML = html;

        Array.from( document.getElementsByClassName("btn_ftd_change_val")).forEach(function(element) {
            element.addEventListener('dblclick', function() {
                const modal = new tingle.modal({
                    footer: true,
                    onClose() {
                        modal.destroy();
                    }
                });
                let id = this.id;

                modal.setContent(`
                <form id="lancForm">
                      <div class="row">
                            <label for="nome">*Valor:</label>
                            <input type="number" step="0.01" id="ftd_value">
                      </div>
                </form>
                `);

                modal.addFooterBtn('Editar Valor', 'tingle-btn tingle-btn--primary', function() {
                    modal.close();
                    new Promise((res,rej) => {setFontesDin(document.getElementById("ftd_value").value,id,res,rej);})
                        .then(() => {Snackbar("Valor editado com sucesso!","success");})
                        .catch(() => {Snackbar("Valor editado com falha!","danger");})
                });
                modal.open();
            });
        });
    });
}

//Funções auxiliares

function getJson(something) {
    if(!something) return "Parâmetro vazio";
    return fetch(apiUrl+something)
        .then(wrapped => wrapped.json())
}

function getLancs(params) {getJson("lancamentos"+params).then(result => {lancamentosLista = result; setLanc();})}

function formatter(type,value) {
    switch (type) {
        case "money-br":
            let numberFormat1 = new Intl.NumberFormat('BRL',{ style: 'currency', currency: 'BRL' });
            return "R$ "+numberFormat1.format(value).replace("R$","");
            break;
        case "date-br":
            return new Date(value).toLocaleDateString("pt-br");
            break;
    }
}

function obj2url(obj) {
    if(typeof obj !== "object") return false;

    let str = "?";

    const keys = Object.keys(obj);

    for(let i=0; i < keys.length; i++) {
        if (i>0) {str += "&";}
        str += `${keys[i]}=${obj[keys[i]]}`;
    }

    return str;
}

function setFontesDin(value,id,res,rej) {
    fetch(apiUrl+"editarFtdValor",{
        method:"POST",
        body: JSON.stringify({
            valor: value,
            ftd_id: id
        })
    })
        .catch(e => {
            console.log(e);
            rej();
        })
        .then(response => response.text())
            .then(() => {
                atualizarFontesDin();
                res()
            })
            .catch(e => {
                console.log(e);
                rej();
            })
}

function setnovoLanc(obj,res,rej) {
    fetch(apiUrl+"novoLancamento",{method:"POST",body: JSON.stringify(obj)})
        .catch(e => {console.log(e); rej(1);})
        .then(response => response.text())
            .then(() => {
                getLancs(strPesquisa);
                if(novoLancObj.status == 1) {
                    new Promise((res,rej) => {setFontesDin(FonteDinLista[novoLancObj.ftd_id].valor + Number(novoLancObj.a_pagar == 1 ? novoLancObj.valor*-1 : novoLancObj.valor),novoLancObj.ftd_id,res,rej)})
                        .then(() => {res();})
                        .catch(() => {rej(2);})
                }
            })
            .catch(e => {console.log(e); rej(1);});
}

// {
//     user_id:1,
//     nome:"teste",
//     valor:"1000",
//     a_pagar:1,
//     data_pag: new Date().toISOString().slice(0,10),
//     comentario: "Só teste, meu parceiro!",
//     cat_id: 1,
//     ftd_id: 1,
//     agente: "Jairo Filho",
//     mpg_id: 1,
//     status: 1,
//     criacao: new Date().toISOString().slice(0,10)
// }

// instanciate new modal
// const modal = new tingle.modal({
//     footer: true,
//     stickyFooter: false,
//     closeMethods: ['overlay', 'button', 'escape'],
//     closeLabel: "Close",
//     cssClass: ['custom-class-1', 'custom-class-2'],
//     onOpen: function() {
//         // console.log('modal open');
//
//         if(configModal['openModalSearchEvent']) {
//             document.dispatchEvent(openModalSearchEvent);
//             configModal['openModalSearchEvent'] = false;
//         }
//     },
// onClose: function() {
//     // console.log('modal closed');
//     // document.dispatchEvent(new Event('close-modal'));
//     modal.destroy();
// },
//     beforeClose: function() {
//         // here's goes some logic
//         // e.g. save content before closing the modal
//         return true; // close the modal
//         return false; // nothing happens
//     }
// });

// function setCat() {
//     getJson("categorias").then(result => {
//         const teste = document.getElementById("categorias");
//         console.log(teste);
//         console.log(result);
//         for(let i=0;i<result.length;i++) {
//             const coisa = document.createElement("li");
//             coisa.textContent = result[i].nome;
//             teste.appendChild(coisa);
//         }
//     })
// }

// // add a button
// modal.addFooterBtn('Button label', 'tingle-btn tingle-btn--primary', function() {
//     // here goes some logic
//     modal.close();
// });
//
// // add another button
// modal.addFooterBtn('Dangerous action !', 'tingle-btn tingle-btn--danger', function() {
//     // here goes some logic
//     modal.close();
// });
//
// open modal