// Jogo Eco-Fazenda Solar - Agrinho 2026

let fazendeiro; // Antigo painel/barra
let raiosSol = [];
let nuvensPoluicao = [];
let veiculos = [];
let efeitosFlutuantes = [];
let lixosRio = [];
let drones = [];
let pedestres = [];
let barreiras = [];

let energia = 0;
const metaEnergia = 150; // Dificuldade Aumentada (Antes era 100)
let poluidos = 0;
const maxPoluicao = 4; // Dificuldade Aumentada (Antes era 5)
let jogoAtivo = true;
let venceu = false;

let alfaDerrota = 0;
let tamanhoTextoDerrota = 10;

function preload() {
  soundFormats('mp3', 'wav');
}

function setup() {
  createCanvas(600, 400);
  inicializarJogo();
}

function inicializarJogo() {
  energia = 0;
  poluidos = 0;
  jogoAtivo = true;
  venceu = false;
  alfaDerrota = 0;
  tamanhoTextoDerrota = 10;
  
  fazendeiro = new FazendeiroFamiliar();
  raiosSol = [];
  nuvensPoluicao = [];
  veiculos = [];
  efeitosFlutuantes = [];
  lixosRio = [];
  drones = [];
  pedestres = [];
  barreiras = [];
  
  for (let i = 0; i < 3; i++) {
    raiosSol.push(new RaioSol());
  }
}

function draw() {
  let azulCeu = map(energia, 0, metaEnergia, 80, 200);
  let tomVerde = map(energia, 0, metaEnergia, 60, 160);
  background(135, azulCeu, 250); 
  
  desenharCenarioAvancado(tomVerde);

  if (jogoAtivo) {
    gerenciarElementos();
    fazendeiro.atualizar();
    fazendeiro.desenhar();
    
    // Gerenciar Barreiras de Bambu
    for (let i = barreiras.length - 1; i >= 0; i--) {
      barreiras[i].desenhar();
      if (barreiras[i].integridade <= 0) {
        efeitosFlutuantes.push(new EfeitoTexto(barreiras[i].x, barreiras[i].y, "Barreira Quebrou!", color(255, 100, 100)));
        barreiras.splice(i, 1);
      }
    }
    
    // Gerenciar Pedestres
    for (let i = pedestres.length - 1; i >= 0; i--) {
      pedestres[i].atualizar();
      pedestres[i].desenhar();
      if (pedestres[i].foraDaTela()) pedestres.splice(i, 1);
    }
    
    // Gerenciar Drones Limpadores
    for (let i = drones.length - 1; i >= 0; i--) {
      drones[i].atualizar();
      drones[i].desenhar();
      
      // Drone limpa poluição no ar
      for (let j = nuvensPoluicao.length - 1; j >= 0; j--) {
        if (drones[i].verificarColisaoRetangulo(nuvensPoluicao[j].x - nuvensPoluicao[j].tam/2, nuvensPoluicao[j].y - nuvensPoluicao[j].tam/4, nuvensPoluicao[j].tam, nuvensPoluicao[j].tam/2)) {
          efeitosFlutuantes.push(new EfeitoTexto(nuvensPoluicao[j].x, nuvensPoluicao[j].y, "Ar Limpo!", color(0, 255, 255)));
          nuvensPoluicao.splice(j, 1);
          if (poluidos > 0) poluidos--; 
          break;
        }
      }
      
      // Drone limpa lixo do rio
      if (drones[i]) {
        for (let k = lixosRio.length - 1; k >= 0; k--) {
          if (drones[i].verificarColisaoRetangulo(lixosRio[k].x, lixosRio[k].y, lixosRio[k].tamW, lixosRio[k].tamH)) {
            efeitosFlutuantes.push(new EfeitoTexto(lixosRio[k].x, lixosRio[k].y, "Rio Limpo!", color(0, 255, 100)));
            lixosRio.splice(k, 1);
            energia = constrain(energia + 2, 0, metaEnergia); 
            break;
          }
        }
      }
      
      if (drones[i] && drones[i].foraDaTela()) drones.splice(i, 1);
    }
    
    // Gerenciar Raios de Sol
    for (let i = raiosSol.length - 1; i >= 0; i--) {
      raiosSol[i].atualizar();
      raiosSol[i].desenhar();
      if (raiosSol[i].verificarColisao(fazendeiro)) {
        energia = constrain(energia + 4, 0, metaEnergia); // Dificuldade aumentada (+4 em vez de +5)
        efeitosFlutuantes.push(new EfeitoTexto(raiosSol[i].x, raiosSol[i].y, "+4 Energia", color(0, 230, 0)));
        raiosSol[i].resetar();
      }
    }

    // Gerenciar Nuvens de Poluição
    for (let i = nuvensPoluicao.length - 1; i >= 0; i--) {
      nuvensPoluicao[i].atualizar();
      nuvensPoluicao[i].desenhar();
      if (nuvensPoluicao[i].verificarColisao(fazendeiro)) {
        poluidos++;
        energia = constrain(energia - 6, 0, metaEnergia); // Dificuldade aumentada (-6 em vez de -12)
        efeitosFlutuantes.push(new EfeitoTexto(nuvensPoluicao[i].x, nuvensPoluicao[i].y, "Plantação Tóxica!", color(255, 0, 0)));
        fazendeiro.dispararAlerta(); 
        nuvensPoluicao.splice(i, 1); 
      } else if (nuvensPoluicao[i].y > height || nuvensPoluicao[i].y < -50) {
        nuvensPoluicao.splice(i, 1); 
      }
    }

    // Gerenciar Veículos
    for (let i = veiculos.length - 1; i >= 0; i--) {
      veiculos[i].atualizar();
      veiculos[i].desenhar();
      let taxaFumaca = Math.floor(map(energia, 0, metaEnergia, 40, 80)); 
      if (frameCount % taxaFumaca === 0) {
        nuvensPoluicao.push(new Poluicao(veiculos[i].x + veiculos[i].w/2, veiculos[i].y, true)); 
      }
      if (veiculos[i].foraDaTela()) veiculos.splice(i, 1);
    }

    // Gerenciar Lixo do Rio
    for (let i = lixosRio.length - 1; i >= 0; i--) {
      for (let b of barreiras) {
        if (lixosRio[i].x <= b.x + b.w && lixosRio[i].x + lixosRio[i].tamW >= b.x && !lixosRio[i].preso) {
          lixosRio[i].preso = true;
          b.integridade -= 15; // Lixo desgasta mais a barreira agora
        }
      }

      lixosRio[i].atualizar();
      lixosRio[i].desenhar();
      
      if (lixosRio[i].foraDaTela()) {
        poluidos++; 
        lixosRio.splice(i, 1);
      }
    }

    // Textos flutuantes
    for (let i = efeitosFlutuantes.length - 1; i >= 0; i--) {
      efeitosFlutuantes[i].atualizar();
      efeitosFlutuantes[i].desenhar();
      if (efeitosFlutuantes[i].tempoVida <= 0) efeitosFlutuantes.splice(i, 1);
    }

    verificarCondicoesFim();
  } else {
    exibirTelasFinais();
  }
  desenharPlacarAvancado();
}

function gerenciarElementos() {
  if (raiosSol.length < 4 && frameCount % 75 === 0) {
    raiosSol.push(new RaioSol());
  }
  if (frameCount % 85 === 0 && veiculos.length < 3) {
    veiculos.push(new Veiculo());
  }
  if (frameCount % 140 === 0 && pedestres.length < 2) {
    pedestres.push(new Pedestre());
  }
  if (frameCount % 110 === 0) {
    nuvensPoluicao.push(new Poluicao(100, 95, false)); // Caim da fábrica 1
    nuvensPoluicao.push(new Poluicao(220, 95, false)); // Caim da fábrica 2
  }
}

function desenharCenarioAvancado(tomVerde) {
  // 1. Fábricas ao Fundo
  fill(70, 75, 80);
  rect(60, 95, 70, 40);
  rect(75, 60, 15, 35); rect(105, 50, 15, 45); 
  rect(190, 100, 60, 35);
  rect(200, 55, 12, 45);
  
  fill(180, 50, 50);
  rect(75, 65, 15, 5); rect(105, 58, 15, 5); rect(200, 65, 12, 5);

  // 2. Estrada
  fill(60); rect(0, 130, width, 35);
  stroke(255, 255, 0); strokeWeight(1.5);
  for (let x = 0; x < width; x += 30) line(x, 147, x + 15, 147);
  noStroke();

  // 3. Campo da Fazenda
  fill(34, tomVerde, 34); rect(0, 165, width, 180);
  
  // Casa Sustentável
  fill(150, 75, 0); rect(480, 200, 60, 50); 
  fill(200, 0, 0); triangle(470, 200, 510, 165, 550, 200); 
  if (energia > 20 && jogoAtivo) fill(255, 255, 0); else fill(50);
  rect(500, 215, 20, 20);

  desenharArvore(40, 220, tomVerde);
  desenharArvore(430, 250, tomVerde);

  // 4. Margem/Calçada onde o Fazendeiro anda
  fill(120, 90, 60); rect(0, 335, width, 12);

  // 5. Rio poluído
  fill(30, 120, 180); rect(0, 347, width, 55);
}

function desenharArvore(x, y, tomVerde) {
  fill(101, 67, 33); rect(x - 5, y, 10, 25);
  fill(34, tomVerde + 30, 34); ellipse(x, y, 35, 35);
}

function verificarCondicoesFim() {
  if (energia >= metaEnergia) { venceu = true; jogoAtivo = false; }
  else if (poluidos >= maxPoluicao) { venceu = false; jogoAtivo = false; }
}

function desenharPlacarAvancado() {
  fill(0); textSize(14); textAlign(LEFT);
  text("Sustentabilidade: " + energia + " / " + metaEnergia + "%", 20, 25);
  if (poluidos >= maxPoluicao - 1) fill(200, 0, 0); 
  text("Índice de Poluição: " + poluidos + " / " + maxPoluicao, 20, 45);
  
  fill(0, 102, 204); textSize(11);
  text("[ESPAÇO]: Chamar Drone Limpador  |  [B]: Fixar Bambu na posição do Fazendeiro", 20, 115);
  
  fill(255); stroke(0); strokeWeight(1); rect(20, 55, 120, 12, 2); noStroke();
  fill(0, 200, 100); rect(20, 55, map(energia, 0, metaEnergia, 0, 120), 12, 2);
}

function keyPressed() {
  if ((key === 'r' || key === 'R') && !jogoAtivo) {
    inicializarJogo();
  }
  if (key === ' ' && jogoAtivo) {
    drones.push(new DroneLimpador(fazendeiro.x + fazendeiro.w / 2, fazendeiro.y));
  }
  if ((key === 'b' || key === 'B') && jogoAtivo) {
    if (barreiras.length < 2) { 
      barreiras.push(new BarreiraBambu(fazendeiro.x + fazendeiro.w / 2 - 6));
      efeitosFlutuantes.push(new EfeitoTexto(fazendeiro.x, fazendeiro.y - 20, "Bambu Posto!", color(139, 186, 139)));
    }
  }
}

function exibirTelasFinais() {
  fill(0, 0, 0, 200); rect(0, 0, width, height);
  textAlign(CENTER);
  if (venceu) {
    fill(255); textSize(24);
    text("Parabéns, Produtor Nota 10!", width / 2, height / 2 - 30);
    textSize(14); fill(180, 255, 180);
    text("Sua fazenda superou toda a poluição industrial com muito esforço!", width / 2, height / 2 + 10);
    fill(255); text("Pressione 'R' para recomeçar o desafio.", width / 2, height / 2 + 60);
  } else {
    fill(255, 50, 50);
    if (tamanhoTextoDerrota < 28) tamanhoTextoDerrota += 0.4;
    textSize(tamanhoTextoDerrota); text("A FAZENDA FOI RENOUNCIADA!", width / 2, height / 2 - 30);
    textSize(14); fill(220);
    text("A poluição sufocou a produção familiar. Tente agir mais rápido!", width / 2, height / 2 + 15);
    text("Pressione 'R' para tentar novamente.", width / 2, height / 2 + 60);
  }
}

// --- CLASSES DO JOGO ---

class FazendeiroFamiliar {
  constructor() {
    this.w = 20; 
    this.h = 40; 
    this.x = width / 2 - this.w / 2; 
    this.y = 295; // Posicionado perfeitamente sobre a calçada/margem
    this.velocidade = 7; 
    this.alertaFrames = 0;
  }
  dispararAlerta() { this.alertaFrames = 15; }
  atualizar() {
    if (keyIsDown(LEFT_ARROW) && this.x > 0) this.x -= this.velocidade;
    if (keyIsDown(RIGHT_ARROW) && this.x < width - this.w) this.x += this.velocidade;
    if (this.alertaFrames > 0) this.alertaFrames--;
  }
  desenhar() {
    push();
    if (this.alertaFrames > 0 && frameCount % 4 < 2) {
      fill(255, 0, 0);
    } else {
      fill(70, 130, 180); // Calça jeans do agricultor
    }
    
    // Corpo/Roupa (Camisa xadrez/caipira simulada)
    fill(210, 105, 30); rect(this.x, this.y + 12, this.w, 18, 2); 
    fill(50, 50, 150); rect(this.x + 2, this.y + 30, 6, 10); rect(this.x + 12, this.y + 30, 6, 10); // Pernas
    
    // Cabeça e Braços
    fill(240, 200, 160); ellipse(this.x + this.w/2, this.y + 5, 14, 14); 
    
    // Chapéu de Palha Típico do Produtor Familiar
    fill(230, 195, 100);
    ellipse(this.x + this.w/2, this.y - 2, 26, 6); // Aba
    rect(this.x + this.w/2 - 6, this.y - 8, 12, 7, 2); // Topo do chapéu
    pop();
  }
}

class Pedestre {
  constructor() {
    this.x = width + 20;
    this.y = 336;
    this.vel = random(1.2, 2.5);
    this.corRoupa = color(random(100, 255), random(100, 255), random(100, 255));
    this.poluidor = random(1) > 0.35; // Chance maior de poluir
    this.jaJogouLixo = false;
    this.tempoParaPoluir = random(80, 450); 
  }
  atualizar() {
    this.x -= this.vel;
    if (this.poluidor && !this.jaJogouLixo && this.x < this.tempoParaPoluir) {
      lixosRio.push(new LixoRio(this.x, this.y + 15));
      this.jaJogouLixo = true;
    }
  }
  desenhar() {
    fill(this.corRoupa); rect(this.x - 4, this.y - 12, 8, 12, 2); 
    fill(240, 200, 160); ellipse(this.x, this.y - 16, 8, 8); 
    if (this.poluidor && !this.jaJogouLixo) {
      fill(120, 60, 10); ellipse(this.x + 4, this.y - 6, 5, 5); 
    }
  }
  foraDaTela() { return this.x < -20; }
}

class BarreiraBambu {
  constructor(x) {
    this.x = x; this.y = 345; this.w = 12; this.h = 50; this.integridade = 100;
  }
  desenhar() {
    stroke(50, 90, 50); strokeWeight(1);
    fill(120, 170, 120, map(this.integridade, 0, 100, 40, 255));
    rect(this.x, this.y, this.w, this.h, 3);
    line(this.x, this.y + 12, this.x + this.w, this.y + 12);
    line(this.x, this.y + 25, this.x + this.w, this.y + 25);
    line(this.x, this.y + 37, this.x + this.w, this.y + 37);
    noStroke();
  }
}

class RaioSol {
  constructor() { this.resetar(); }
  resetar() { this.x = random(30, width - 30); this.y = random(-100, -20); this.vel = random(3, 5); this.tam = 18; }
  atualizar() { this.y += this.vel; if (this.y > height) this.resetar(); }
  desenhar() {
    fill(255, 215, 0); ellipse(this.x, this.y, this.tam, this.tam);
    fill(255, 255, 150, 150); ellipse(this.x, this.y, this.tam - 6, this.tam - 6);
  }
  verificarColisao(f) {
    // Colisão ajustada para o formato do Fazendeiro
    return (this.y + this.tam/2 > f.y && this.y - this.tam/2 < f.y + f.h && 
            this.x + this.tam/2 > f.x && this.x - this.tam/2 < f.x + f.w);
  }
}

class Veiculo {
  constructor() {
    this.x = -80; this.y = 136; this.vel = random(2.5, 5);
    this.tipo = random(['carro', 'moto', 'caminhao']);
    this.cor = color(random(50, 200), random(50, 150), random(50, 200));
    if (this.tipo === 'moto') { this.w = 22; this.h = 12; this.y = 142; }
    else if (this.tipo === 'carro') { this.w = 40; this.h = 15; }
    else if (this.tipo === 'caminhao') { this.w = 60; this.h = 22; this.y = 129; this.vel = random(2, 3.5); }
  }
  atualizar() { this.x += this.vel; }
  desenhar() {
    fill(this.cor);
    if (this.tipo === 'moto') {
      rect(this.x, this.y, this.w, this.h, 2); fill(0);
      ellipse(this.x + 4, this.y + this.h, 7, 7); ellipse(this.x + this.w - 4, this.y + this.h, 7, 7);
    } else if (this.tipo === 'carro') {
      rect(this.x, this.y, this.w, this.h, 3); fill(0);
      ellipse(this.x + 8, this.y + this.h, 8, 8); ellipse(this.x + this.w - 8, this.y + this.h, 8, 8);
    } else if (this.tipo === 'caminhao') {
      rect(this.x, this.y, 40, this.h - 2); fill(this.cor);
      rect(this.x + 40, this.y + 4, 18, this.h - 6, 2); fill(0);
      ellipse(this.x + 8, this.y + this.h, 10, 10); ellipse(this.x + 48, this.y + this.h, 10, 10);
    }
  }
  foraDaTela() { return this.x > width + 90; }
}

class Poluicao {
  constructor(x, y, vindoDeCarro = false) {
    this.x = x; this.y = y; this.velX = random(-0.4, 0.4);
    this.vindoDeCarro = vindoDeCarro;
    this.tam = random(24, 34);
    this.baseVelY = vindoDeCarro ? random(-1, -1.8) : random(2, 3.8);
  }
  atualizar() { 
    this.x += this.velX; 
    
    // SISTEMA PEDIDO: A velocidade de queda diminui conforme a energia gerada aumenta!
    if (!this.vindoDeCarro) {
      let fatorFrenagem = map(energia, 0, metaEnergia, 1, 0.35); 
      this.y += this.baseVelY * fatorFrenagem;
    } else {
      this.y += this.baseVelY; // Fumaça do carro sobe normal
    }
  }
  desenhar() {
    fill(80, 80, 80, 170); ellipse(this.x, this.y, this.tam, this.tam - 8);
  }
  verificarColisao(f) {
    return (this.y + this.tam/4 > f.y && this.y - this.tam/4 < f.y + f.h && 
            this.x + this.tam/2 > f.x && this.x - this.tam/2 < f.x + f.w);
  }
}

class LixoRio {
  constructor(customX, customY) {
    this.x = customX !== undefined ? customX : width + random(10, 50); 
    this.y = customY !== undefined ? customY : random(355, 380);
    this.vel = random(1.3, 2.2); this.tamW = 20; this.tamH = 10;
    this.preso = false; 
  }
  atualizar() { 
    if (!this.preso) this.x -= this.vel; 
  } 
  desenhar() {
    fill(180, 90, 40); rect(this.x, this.y, this.tamW, this.tamH, 2);
    fill(100, 180, 255, 180); rect(this.x + 5, this.y + 2, 8, 5);
  }
  foraDaTela() { return this.x < -30; }
}

class DroneLimpador {
  constructor(x, y) {
    this.x = x; this.y = y; this.vel = 5; this.tam = 15;
    this.subindo = true;
  }
  atualizar() {
    if (this.subindo) { 
      this.y -= this.vel; 
      if (this.y < 40) this.subindo = false; 
    } else { 
      this.y += this.vel + 2; 
    }
  }
  desenhar() {
    fill(0, 200, 255); rect(this.x - 10, this.y, 20, 6, 2); 
    fill(50); ellipse(this.x - 8, this.y, 8, 3); ellipse(this.x + 8, this.y, 8, 3); 
    fill(0, 255, 0); ellipse(this.x, this.y + 3, 4, 4); 
  }
  verificarColisaoRetangulo(rx, ry, rw, rh) {
    return (this.x + 10 > rx && this.x - 10 < rx + rw &&
            this.y + 6 > ry && this.y < ry + rh);
  }
  foraDaTela() { return this.y > height + 20; }
}

class EfeitoTexto {
  constructor(x, y, txt, cor) { this.x = x; this.y = y; this.txt = txt; this.cor = cor; this.tempoVida = 255; }
  atualizar() { this.y -= 1; this.tempoVida -= 12; }
  desenhar() {
    textSize(11); textAlign(CENTER);
    fill(red(this.cor), green(this.cor), blue(this.cor), this.tempoVida);
    text(this.txt, this.x, this.y);
  }
}