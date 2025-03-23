const dateInput = document.getElementById('dateFilter');
const morningList = document.getElementById('morning-list');
const afternoonList = document.getElementById('afternoon-list');
const nightList = document.getElementById('night-list');
const newAppointmentBtn = document.getElementById('newAppointment');
const exportarBtn = document.getElementById('exportarPDF');
const toggleFinalizadosBtn = document.getElementById('toggleFinalizados');
const modal = document.getElementById('modal');
const form = document.getElementById('form-agendamento');
const cancelar = document.getElementById('cancelar');
const inputDataModal = document.getElementById('data-agendamento');

let agendamentos = JSON.parse(localStorage.getItem('agendamentos')) || [];
let mostrandoFinalizados = false;

dateInput.valueAsDate = new Date();
renderAgenda(dateInput.value);

function renderAgenda(dataSelecionada) {
  morningList.innerHTML = '';
  afternoonList.innerHTML = '';
  nightList.innerHTML = '';

  const agendamentosDoDia = agendamentos.filter(a =>
    a.data === dataSelecionada &&
    (mostrandoFinalizados ? a.finalizado : true)
  );

  agendamentosDoDia.forEach(ag => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${ag.horario}</strong> ${ag.pet} / ${ag.tutor}<br />
        <span>${ag.servico}</span>
        ${ag.finalizado ? `<br><em>Finalizado às ${ag.horarioReal}</em>` : ''}
      </div>
      <div>
        <button onclick="editarAgendamento(${ag.id})" class="icon-btn" title="Editar">✏️</button>
        <button onclick="finalizarAgendamento(${ag.id})" class="icon-btn" title="Finalizar">✅</button>
        <button onclick="removerAgendamento(${ag.id})" class="icon-btn" title="Remover">🗑️</button>
      </div>
    `;
    if (ag.finalizado) li.style.opacity = 0.6;

    const hora = parseInt(ag.horario.split(':')[0]);
    if (hora >= 9 && hora <= 12) {
      morningList.appendChild(li);
    } else if (hora >= 13 && hora <= 18) {
      afternoonList.appendChild(li);
    } else if (hora >= 19 && hora <= 21) {
      nightList.appendChild(li);
    }
  });
}
function removerAgendamento(id) {
    const confirmBox = document.createElement('div');
    confirmBox.className = 'confirm-box';
    confirmBox.innerHTML = `
      <p>Deseja realmente remover este agendamento?</p>
      <button id="confirmSim">Sim</button>
      <button id="confirmNao">Não</button>
    `;
    document.body.appendChild(confirmBox);
  
    document.getElementById('confirmSim').onclick = () => {
      agendamentos = agendamentos.filter(a => a.id !== id);
      localStorage.setItem('agendamentos', JSON.stringify(agendamentos));
      renderAgenda(dateInput.value);
      confirmBox.remove();
    };
  
    document.getElementById('confirmNao').onclick = () => {
      confirmBox.remove();
    };
  }
  
  function editarAgendamento(id) {
    const ag = agendamentos.find(a => a.id === id);
    if (!ag) return;
    form.dataset.editId = id;
    document.getElementById('pet').value = ag.pet;
    document.getElementById('tutor').value = ag.tutor;
    document.getElementById('servico').value = ag.servico;
    document.getElementById('horario').value = ag.horario;
    document.getElementById('data-agendamento').value = ag.data;
    modal.classList.remove('hidden');
  }
  
  function finalizarAgendamento(id) {
    const horarioReal = prompt("Informe o horário REAL do atendimento:");
    if (!horarioReal || !/^[0-9]{2}:[0-9]{2}$/.test(horarioReal)) {
      alert("Horário inválido.");
      return;
    }
  
    const ag = agendamentos.find(a => a.id === id);
    if (!ag) return;
  
    ag.finalizado = true;
    ag.horarioReal = horarioReal;
    localStorage.setItem('agendamentos', JSON.stringify(agendamentos));
    renderAgenda(dateInput.value);
  }
  
  toggleFinalizadosBtn.addEventListener('click', () => {
    mostrandoFinalizados = !mostrandoFinalizados;
    renderAgenda(dateInput.value);
  });
  
  exportarBtn.addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(14);
    doc.text("Agendamentos - " + dateInput.value, 10, y);
    y += 10;
    const ags = agendamentos.filter(a => a.data === dateInput.value);
    ags.forEach(ag => {
      doc.setFontSize(12);
      doc.text(`${ag.horario} - ${ag.pet} / ${ag.tutor} - ${ag.servico}`, 10, y);
      y += 8;
    });
    doc.save("agenda-pet.pdf");
  });
  
  dateInput.addEventListener('change', () => {
    renderAgenda(dateInput.value);
  });
  
  newAppointmentBtn.addEventListener('click', () => {
    form.reset();
    delete form.dataset.editId;
    modal.classList.remove('hidden');
    inputDataModal.value = dateInput.value;
    document.getElementById('erro-horario').textContent = '';
    document.getElementById('horario').classList.remove('erro');
  });
  
  cancelar.addEventListener('click', () => {
    modal.classList.add('hidden');
    form.reset();
  });
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
  
    const horarioInput = document.getElementById('horario');
    const erroHorario = document.getElementById('erro-horario');
  
    const novo = {
      pet: document.getElementById('pet').value,
      tutor: document.getElementById('tutor').value,
      servico: document.getElementById('servico').value,
      horario: horarioInput.value,
      data: document.getElementById('data-agendamento').value,
      telefone: document.getElementById('telefone').value,
    };
  
    const hora = parseInt(novo.horario.split(':')[0]);
    const horaValida =
      (hora >= 9 && hora <= 11) ||
      (hora >= 13 && hora <= 17) ||
      (hora >= 19 && hora <= 21);
  
    horarioInput.classList.remove('erro');
    erroHorario.textContent = '';
  
    if (!horaValida) {
      horarioInput.classList.add('erro');
      erroHorario.textContent = "Horário fora do expediente (09h–11h, 13h–17h, 19h–21h)";
      return;
    }
  
    const idEditando = form.dataset.editId;
    if (idEditando) {
      const index = agendamentos.findIndex(a => a.id == idEditando);
      if (index !== -1) {
        agendamentos[index] = { id: +idEditando, ...novo };
      }
      delete form.dataset.editId;
    } else {
      novo.id = Date.now();
      agendamentos.push(novo);
    }
  
    localStorage.setItem('agendamentos', JSON.stringify(agendamentos));
    renderAgenda(dateInput.value);
    form.reset();
    modal.classList.add('hidden');
  });
  