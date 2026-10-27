/**
 * 2026 사제동행 체육활동 - 축구 대진표 & 개인별 승점 관리 시스템
 * Comprehensive Vanilla JavaScript Core
 */

// ==========================================
// 1. STATE & DEFAULT CONFIG
// ==========================================

const STORAGE_KEY = 'SAJE_SOCCER_TOURNAMENT_2026';

const defaultTeams = {
  1: { id: 1, name: '1팀 (열정 Red)', color: 'red' },
  2: { id: 2, name: '2팀 (지혜 Blue)', color: 'blue' },
  3: { id: 3, name: '3팀 (화합 Green)', color: 'green' },
  4: { id: 4, name: '4팀 (희망 Yellow)', color: 'yellow' }
};

const defaultRules = {
  winPts: 3,
  drawPts: 1,
  goalPts: 1,
  assistPts: 1,
  fairPts: 1
};

// State Object
let state = {
  roster: [], // [{ id, no, grade, name, team }]
  teams: JSON.parse(JSON.stringify(defaultTeams)),
  matches: [], // [{ id, name, homeTeamId, awayTeamId, homeScore, awayScore, status: 'waiting'|'playing'|'done', events: [] }]
  matchMode: 'league', // 'league' | 'tournament' | 'double' | 'custom'
  customMatchCount: 5,
  activeMatchId: null,
  rules: { ...defaultRules },
  activeLeaderboardFilter: 'all',
  activeGoalModalTeamSide: 'home',
  timer: {
    duration: 600, // 10 minutes (seconds)
    remaining: 600,
    isRunning: false,
    intervalId: null
  }
};

// Real Participant Sample Roster (학생 20명 + 교사 4명 = 24명)
const sampleRoster20 = [
  { no: 1, grade: '3학년', name: '김주원' },
  { no: 2, grade: '3학년', name: '박보성' },
  { no: 3, grade: '3학년', name: '김승민' },
  { no: 4, grade: '3학년', name: '홍혜준' },
  { no: 5, grade: '3학년', name: '김준서' },
  { no: 6, grade: '3학년', name: '정원석' },
  { no: 7, grade: '3학년', name: '박희동' },
  { no: 8, grade: '3학년', name: '이근호' },
  { no: 9, grade: '3학년', name: '김민준' },
  { no: 10, grade: '3학년', name: '노윤제' },
  { no: 11, grade: '2학년', name: '김수종' },
  { no: 12, grade: '2학년', name: '한서진' },
  { no: 13, grade: '2학년', name: '장승헌' },
  { no: 14, grade: '2학년', name: '신호준' },
  { no: 15, grade: '2학년', name: '손민식' },
  { no: 16, grade: '2학년', name: '우정원' },
  { no: 17, grade: '2학년', name: '정찬영' },
  { no: 18, grade: '2학년', name: '김서완' },
  { no: 19, grade: '2학년', name: '나시온' },
  { no: 20, grade: '2학년', name: '조운찬' },
  // 교사 4명 (학년 필드에 '교사'로 통합 관리, 4개 팀에 1명씩 균등 배정)
  { no: 21, grade: '교사', name: '김선생' },
  { no: 22, grade: '교사', name: '이선생' },
  { no: 23, grade: '교사', name: '박선생' },
  { no: 24, grade: '교사', name: '정선생' }
];

// 전교생 확대 명단 (학생 32명 + 교사 4명 = 총 36명)
const sampleRoster36 = [
  ...sampleRoster20,
  { no: 25, grade: '1학년', name: '김도윤' },
  { no: 26, grade: '1학년', name: '박준석' },
  { no: 27, grade: '1학년', name: '윤준석' },
  { no: 28, grade: '1학년', name: '임은혁' },
  { no: 29, grade: '1학년', name: '장준우' },
  { no: 30, grade: '1학년', name: '허준표' },
  { no: 31, grade: '3학년', name: '최호순' },
  { no: 32, grade: '3학년', name: '한진우' },
  { no: 33, grade: '2학년', name: '이은찬' },
  { no: 34, grade: '2학년', name: '이성우' },
  { no: 35, grade: '1학년', name: '김지운' },
  { no: 36, grade: '1학년', name: '박성빈' }
];

// ==========================================
// 2. INITIALIZATION & STORAGE
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  
  if (!state.roster || state.roster.length === 0) {
    loadSampleRoster(1, false);
  }

  if (!state.matches || state.matches.length === 0) {
    generateMatches(state.matchMode, state.customMatchCount);
  }

  renderAll();
  setupGlobalShortcuts();
});

function saveToStorage() {
  try {
    const dataToSave = {
      roster: state.roster,
      teams: state.teams,
      matches: state.matches,
      matchMode: state.matchMode,
      customMatchCount: state.customMatchCount,
      activeMatchId: state.activeMatchId,
      rules: state.rules
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (e) {
    console.error('Storage save error:', e);
  }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = { ...state, ...parsed };
      // Ensure active match exists
      if (!state.activeMatchId && state.matches.length > 0) {
        state.activeMatchId = state.matches[0].id;
      }
    }
  } catch (e) {
    console.error('Storage load error:', e);
  }
}

function resetAllDataConfirm() {
  if (confirm('⚠️ 모든 인원 명단, 팀 배정, 경기 대진표 및 승점 기록을 초기화하시겠습니까?')) {
    localStorage.removeItem(STORAGE_KEY);
    state.roster = [];
    state.teams = JSON.parse(JSON.stringify(defaultTeams));
    state.matches = [];
    state.matchMode = 'league';
    state.customMatchCount = 5;
    state.activeMatchId = null;
    state.rules = { ...defaultRules };
    loadSampleRoster(1, false);
    generateMatches('league');
    switchView('setup');
    renderAll();
    showToast('모든 데이터가 초기화되었습니다.');
  }
}

// ==========================================
// 3. KEYBOARD SHORTCUTS & VIEW SWITCHING
// ==========================================

function setupGlobalShortcuts() {
  window.addEventListener('keydown', (e) => {
    // 1. Enter key trigger on Setup view
    if (e.key === 'Enter') {
      const activeElement = document.activeElement;
      const isInput = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'SELECT');
      
      // If currently in Setup View, trigger tournament start!
      const setupView = document.getElementById('viewSetup');
      if (setupView && setupView.classList.contains('active')) {
        // If pressing enter inside a sheet-input, we still want to save the edit, but let's allow Enter to start if modal is not open
        const pasteModal = document.getElementById('pasteModal');
        if (pasteModal && pasteModal.style.display !== 'none') {
          return; // Let modal handle enter
        }
        
        // Start tournament!
        e.preventDefault();
        startTournament();
      }
    }

    // 2. Spacebar shortcut to pause/resume timer in match view
    if (e.code === 'Space') {
      const matchView = document.getElementById('viewMatch');
      const activeElement = document.activeElement;
      const isInput = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');
      if (matchView && matchView.classList.contains('active') && !isInput) {
        e.preventDefault();
        toggleTimer();
      }
    }
  });
}

function switchView(viewName) {
  const viewSetup = document.getElementById('viewSetup');
  const viewMatch = document.getElementById('viewMatch');
  const tabSetupBtn = document.getElementById('tabSetupBtn');
  const tabMatchBtn = document.getElementById('tabMatchBtn');

  if (viewName === 'setup') {
    viewSetup.classList.add('active');
    viewMatch.classList.remove('active');
    tabSetupBtn.classList.add('active');
    tabMatchBtn.classList.remove('active');
  } else {
    viewSetup.classList.remove('active');
    viewMatch.classList.add('active');
    tabSetupBtn.classList.remove('active');
    tabMatchBtn.classList.add('active');
    renderMatchView();
  }
}

// ==========================================
// 4. ROSTER SHEET MANAGEMENT (인원 시트)
// ==========================================

function renderRosterTable() {
  const tbody = document.getElementById('rosterTbody');
  const countBadge = document.getElementById('rosterCountBadge');
  if (!tbody) return;

  countBadge.textContent = `총 ${state.roster.length}명`;

  if (state.roster.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 30px; color: var(--text-muted);">
          등록된 인원이 없습니다. [+ 인원 추가] 버튼이나 [사제동행 명단 로드]를 눌러주세요.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = state.roster.map((player, idx) => `
    <tr data-id="${player.id}">
      <td>
        <input type="number" class="sheet-input" value="${player.no}" 
          onchange="updatePlayerField('${player.id}', 'no', this.value)" style="text-align: center;">
      </td>
      <td>
        <input type="text" class="sheet-input ${player.grade === '교사' ? 'input-teacher' : ''}" 
          list="gradeDatalist" value="${escapeHtml(player.grade)}" 
          placeholder="예: 3학년, 교사" onchange="updatePlayerField('${player.id}', 'grade', this.value)">
      </td>
      <td>
        <input type="text" class="sheet-input" value="${escapeHtml(player.name)}" 
          placeholder="선수 이름" onchange="updatePlayerField('${player.id}', 'name', this.value)" style="font-weight: 600;">
      </td>
      <td>
        <select class="sheet-select" onchange="updatePlayerField('${player.id}', 'team', this.value ? parseInt(this.value) : null)">
          <option value="">미배정</option>
          <option value="1" ${player.team === 1 ? 'selected' : ''}>${escapeHtml(state.teams[1].name)}</option>
          <option value="2" ${player.team === 2 ? 'selected' : ''}>${escapeHtml(state.teams[2].name)}</option>
          <option value="3" ${player.team === 3 ? 'selected' : ''}>${escapeHtml(state.teams[3].name)}</option>
          <option value="4" ${player.team === 4 ? 'selected' : ''}>${escapeHtml(state.teams[4].name)}</option>
        </select>
      </td>
      <td style="text-align: center;">
        <button class="sheet-row-del" onclick="deleteRow('${player.id}')" title="행 삭제">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function addRow() {
  const newNo = state.roster.length + 1;
  const newPlayer = {
    id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    no: newNo,
    grade: '3학년',
    name: '신규선수' + newNo,
    team: null
  };
  state.roster.push(newPlayer);
  saveToStorage();
  renderRosterTable();
  renderTeamsBoxes();

  // Scroll to bottom and focus on new input
  setTimeout(() => {
    const table = document.querySelector('.sheet-container');
    if (table) table.scrollTop = table.scrollHeight;
  }, 50);
}

function updatePlayerField(id, field, value) {
  const player = state.roster.find(p => p.id === id);
  if (!player) return;

  if (field === 'no') {
    player.no = parseInt(value) || 0;
  } else if (field === 'grade') {
    player.grade = value.trim();
  } else if (field === 'name') {
    player.name = value.trim();
  } else if (field === 'team') {
    player.team = value;
  }

  saveToStorage();
  renderTeamsBoxes();
  renderLeaderboard();
}

function deleteRow(id) {
  state.roster = state.roster.filter(p => p.id !== id);
  saveToStorage();
  renderRosterTable();
  renderTeamsBoxes();
  renderLeaderboard();
}

function renumberRoster() {
  state.roster.forEach((p, idx) => {
    p.no = idx + 1;
  });
  saveToStorage();
  renderRosterTable();
  showToast('연번이 1번부터 차례대로 재정렬되었습니다.');
}

function clearRosterConfirm() {
  if (confirm('정말 모든 인원을 삭제하시겠습니까?')) {
    state.roster = [];
    saveToStorage();
    renderRosterTable();
    renderTeamsBoxes();
    showToast('인원 시트가 비워졌습니다.');
  }
}

function loadSampleRoster(type = 1, showToastMsg = true) {
  const list = type === 1 ? sampleRoster20 : sampleRoster36;
  state.roster = list.map((item, idx) => ({
    id: 'p_' + (idx + 1) + '_' + Math.random().toString(36).substr(2, 4),
    no: item.no,
    grade: item.grade,
    name: item.name,
    team: null
  }));

  // Auto assign teams balanced
  autoAssignTeams('balanced', false);

  saveToStorage();
  renderRosterTable();
  renderTeamsBoxes();
  if (showToastMsg) {
    showToast(`사제동행 명단(${list.length}명)이 성공적으로 로드되었습니다!`);
  }
}

// ==========================================
// 5. EXCEL PASTE MODAL PARSER
// ==========================================

function openPasteModal() {
  document.getElementById('pasteModal').style.display = 'flex';
  document.getElementById('pasteTextarea').focus();
}

function closePasteModal() {
  document.getElementById('pasteModal').style.display = 'none';
}

function applyPastedRoster() {
  const text = document.getElementById('pasteTextarea').value.trim();
  const overwrite = document.getElementById('pasteOverwrite').checked;

  if (!text) {
    alert('붙여넣을 텍스트 내용을 입력해주세요.');
    return;
  }

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const parsed = [];

  let startNo = overwrite ? 1 : state.roster.length + 1;

  for (let line of lines) {
    // Delimiter: Tab or comma or multiple spaces
    let tokens = line.split(/\t/);
    if (tokens.length <= 1) {
      tokens = line.split(/,/);
    }
    if (tokens.length <= 1) {
      tokens = line.split(/\s{2,}/);
    }
    tokens = tokens.map(t => t.trim()).filter(t => t.length > 0);

    let no = startNo;
    let grade = '3학년';
    let name = '';

    if (tokens.length >= 3) {
      // Form: No | Grade | Name
      const parsedNo = parseInt(tokens[0]);
      no = !isNaN(parsedNo) ? parsedNo : startNo;
      grade = tokens[1];
      name = tokens[2];
    } else if (tokens.length === 2) {
      // Form: Grade | Name
      grade = tokens[0];
      name = tokens[1];
    } else if (tokens.length === 1) {
      // Just name
      name = tokens[0];
    }

    // 교원/선생 표기를 '교사'로 자동 정규화
    if (grade && (grade.includes('교원') || grade.includes('선생') || grade.includes('지도교사') || grade.includes('교사'))) {
      grade = '교사';
    }

    if (name) {
      parsed.push({
        id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        no: no,
        grade: grade || '3학년',
        name: name,
        team: null
      });
      startNo++;
    }
  }

  if (parsed.length === 0) {
    alert('인식 가능한 참가자 데이터가 없습니다.');
    return;
  }

  if (overwrite) {
    state.roster = parsed;
  } else {
    state.roster = [...state.roster, ...parsed];
  }

  // Auto assign teams
  autoAssignTeams('balanced', false);

  saveToStorage();
  renderRosterTable();
  renderTeamsBoxes();
  closePasteModal();
  document.getElementById('pasteTextarea').value = '';
  showToast(`${parsed.length}명의 인원이 성공적으로 반영되었습니다.`);
}

// ==========================================
// 5-1. ROSTER SAVE & LOAD MANAGEMENT (명단 저장 / 불러오기)
// ==========================================

function openSaveRosterModal() {
  document.getElementById('saveRosterModal').style.display = 'flex';
}

function closeSaveRosterModal() {
  document.getElementById('saveRosterModal').style.display = 'none';
}

function openLoadRosterModal() {
  const saved = localStorage.getItem('SAJE_USER_SAVED_ROSTER');
  const metaEl = document.getElementById('browserSavedPresetMeta');
  const btnEl = document.getElementById('loadBrowserPresetBtn');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      const dateStr = data.savedAt ? new Date(data.savedAt).toLocaleDateString() : '';
      metaEl.textContent = `저장된 명단: 총 ${data.roster ? data.roster.length : 0}명 (${dateStr} 저장됨)`;
      if (btnEl) btnEl.disabled = false;
    } catch(e) {
      metaEl.textContent = '저장된 명단이 없습니다.';
      if (btnEl) btnEl.disabled = true;
    }
  } else {
    metaEl.textContent = '아직 브라우저에 저장해 둔 명단이 없습니다.';
    if (btnEl) btnEl.disabled = true;
  }

  document.getElementById('loadRosterModal').style.display = 'flex';
}

function closeLoadRosterModal() {
  document.getElementById('loadRosterModal').style.display = 'none';
}

// 1. Save to File (CSV or JSON)
function saveRosterToFile(format = 'csv') {
  if (state.roster.length === 0) {
    alert('저장할 참가자 명단이 없습니다. 먼저 인원을 입력해주세요.');
    return;
  }

  const today = new Date().toISOString().slice(0, 10);

  if (format === 'csv') {
    let csv = '\uFEFF연번,학년,이름,소속팀번호,소속팀명\n';
    state.roster.forEach(p => {
      const teamName = p.team ? state.teams[p.team].name : '미배정';
      csv += `${p.no},"${p.grade}","${p.name}",${p.team || ''},"${teamName}"\n`;
    });

    downloadBlob(csv, `사제동행_참가자명단_${today}.csv`, 'text/csv;charset=utf-8;');
    showToast('💾 참가자 명단(CSV) 파일이 다운로드되었습니다.');
  } else if (format === 'json') {
    const data = {
      savedAt: new Date().toISOString(),
      roster: state.roster,
      teams: state.teams
    };
    const jsonStr = JSON.stringify(data, null, 2);
    downloadBlob(jsonStr, `사제동행_명단및팀설정_${today}.json`, 'application/json');
    showToast('💾 명단 백업 파일(JSON)이 다운로드되었습니다.');
  }

  closeSaveRosterModal();
}

function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 2. Save to Browser Preset
function saveRosterToBrowserPreset() {
  if (state.roster.length === 0) {
    alert('저장할 참가자 명단이 없습니다.');
    return;
  }

  const data = {
    savedAt: new Date().toISOString(),
    roster: state.roster,
    teams: state.teams
  };

  localStorage.setItem('SAJE_USER_SAVED_ROSTER', JSON.stringify(data));
  closeSaveRosterModal();
  showToast(`⚡ 현재 명단(${state.roster.length}명)과 팀 이름이 이 브라우저에 안전하게 저장되었습니다!`);
}

// 3. Load from Browser Preset
function loadRosterFromBrowserPreset() {
  const saved = localStorage.getItem('SAJE_USER_SAVED_ROSTER');
  if (!saved) {
    alert('브라우저에 저장된 명단이 없습니다.');
    return;
  }

  try {
    const data = JSON.parse(saved);
    if (data.roster && Array.isArray(data.roster)) {
      state.roster = data.roster;
      if (data.teams) {
        state.teams = data.teams;
      }
      saveToStorage();
      renderAll();
      closeLoadRosterModal();
      showToast(`📂 저장해 두었던 명단(${state.roster.length}명)을 성공적으로 불러왔습니다!`);
    } else {
      alert('저장된 명단 데이터 형식이 올바르지 않습니다.');
    }
  } catch (e) {
    alert('명단을 불러오는 중 오류가 발생했습니다.');
  }
}

// 4. Load from File
function triggerLoadRosterFile() {
  const fileInput = document.getElementById('rosterFileInput');
  if (fileInput) fileInput.click();
  closeLoadRosterModal();
}

function handleRosterFileSelected(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const content = e.target.result;
    
    // Check if JSON
    if (file.name.endsWith('.json')) {
      try {
        const data = JSON.parse(content);
        if (data.roster && Array.isArray(data.roster)) {
          state.roster = data.roster;
          if (data.teams) state.teams = data.teams;
          saveToStorage();
          renderAll();
          showToast(`📂 백업 파일에서 ${state.roster.length}명의 명단과 팀 설정을 불러왔습니다!`);
          event.target.value = '';
          return;
        }
      } catch (err) {
        // Fallback to text
      }
    }

    // CSV or Text parser
    parseLoadedRosterText(content);
    event.target.value = '';
  };

  reader.readAsText(file, 'utf-8');
}

function parseLoadedRosterText(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const parsed = [];
  let startNo = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip header line if contains '연번' or '이름'
    if (i === 0 && (line.includes('연번') || line.includes('이름') || line.includes('학년'))) {
      continue;
    }

    let tokens = line.split(/,|\t/).map(t => t.replace(/^["']|["']$/g, '').trim()).filter(t => t.length > 0);
    if (tokens.length === 0) continue;

    let no = startNo;
    let grade = '3학년';
    let name = '';
    let team = null;

    if (tokens.length >= 4) {
      // No | Grade | Name | Team
      const parsedNo = parseInt(tokens[0]);
      no = !isNaN(parsedNo) ? parsedNo : startNo;
      grade = tokens[1];
      name = tokens[2];
      const parsedTeam = parseInt(tokens[3]);
      if ([1, 2, 3, 4].includes(parsedTeam)) team = parsedTeam;
    } else if (tokens.length === 3) {
      // No | Grade | Name
      const parsedNo = parseInt(tokens[0]);
      no = !isNaN(parsedNo) ? parsedNo : startNo;
      grade = tokens[1];
      name = tokens[2];
    } else if (tokens.length === 2) {
      // Grade | Name
      grade = tokens[0];
      name = tokens[1];
    } else if (tokens.length === 1) {
      name = tokens[0];
    }

    // Normalize 교사
    if (grade && (grade.includes('교원') || grade.includes('선생') || grade.includes('지도교사') || grade.includes('교사'))) {
      grade = '교사';
    }

    if (name) {
      parsed.push({
        id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        no: no,
        grade: grade || '3학년',
        name: name,
        team: team
      });
      startNo++;
    }
  }

  if (parsed.length === 0) {
    alert('파일에서 참가자 데이터를 찾을 수 없습니다.');
    return;
  }

  state.roster = parsed;
  saveToStorage();
  renderAll();
  showToast(`📂 파일에서 ${parsed.length}명의 명단을 성공적으로 불러왔습니다!`);
}

// ==========================================
// 6. 4 TEAMS MANAGEMENT (4개 팀 구성 & 드래그앤드롭)
// ==========================================

function renderTeamsBoxes() {
  for (let teamId = 1; teamId <= 4; teamId++) {
    const team = state.teams[teamId];
    const initialInput = document.getElementById(`initialTeamName${teamId}`);
    const nameInput = document.getElementById(`teamName${teamId}`);
    const countBadge = document.getElementById(`teamCount${teamId}`);
    const summaryDiv = document.getElementById(`teamSummary${teamId}`);
    const listDiv = document.getElementById(`teamMembers${teamId}`);

    if (initialInput && document.activeElement !== initialInput) {
      initialInput.value = team.name;
    }
    if (nameInput && document.activeElement !== nameInput) {
      nameInput.value = team.name;
    }

    const members = state.roster.filter(p => p.team === teamId);
    if (countBadge) countBadge.textContent = `${members.length}명`;

    // Grade summary calculation
    const gradeCounts = {};
    members.forEach(p => {
      gradeCounts[p.grade] = (gradeCounts[p.grade] || 0) + 1;
    });
    const summaryStr = Object.keys(gradeCounts).length > 0
      ? Object.entries(gradeCounts).map(([g, c]) => `${g} ${c}명`).join(', ')
      : '학년 분포: -';
    if (summaryDiv) summaryDiv.textContent = summaryStr;

    // Member chips
    if (listDiv) {
      if (members.length === 0) {
        listDiv.innerHTML = `<div class="empty-team-hint">배정된 선수가 없습니다 (드래그하여 이동 가능)</div>`;
      } else {
        listDiv.innerHTML = members.map(p => `
          <div class="member-chip ${p.grade === '교사' ? 'chip-teacher' : ''}" draggable="true" ondragstart="handleDragStart(event, '${p.id}')" title="드래그하여 다른 팀으로 이동">
            <span class="grade-tag ${p.grade === '교사' ? 'tag-teacher' : ''}">${escapeHtml(p.grade)}</span>
            <strong>${escapeHtml(p.name)}</strong>
          </div>
        `).join('');
      }
    }
  }
}

function updateTeamName(teamId, newName) {
  if (state.teams[teamId]) {
    state.teams[teamId].name = newName;
    
    // Synchronize both inputs without losing focus
    const initialInput = document.getElementById(`initialTeamName${teamId}`);
    const boxInput = document.getElementById(`teamName${teamId}`);
    if (initialInput && initialInput !== document.activeElement) initialInput.value = newName;
    if (boxInput && boxInput !== document.activeElement) boxInput.value = newName;

    saveToStorage();
    renderRosterTableTeamSelects();
    renderScheduleList();
    renderActiveScoreboard();
    renderStandings();
  }
}

function renderRosterTableTeamSelects() {
  const selects = document.querySelectorAll('.sheet-select');
  selects.forEach(sel => {
    const val = sel.value;
    sel.innerHTML = `
      <option value="">미배정</option>
      <option value="1" ${val === '1' ? 'selected' : ''}>${escapeHtml(state.teams[1].name)}</option>
      <option value="2" ${val === '2' ? 'selected' : ''}>${escapeHtml(state.teams[2].name)}</option>
      <option value="3" ${val === '3' ? 'selected' : ''}>${escapeHtml(state.teams[3].name)}</option>
      <option value="4" ${val === '4' ? 'selected' : ''}>${escapeHtml(state.teams[4].name)}</option>
    `;
  });
}

function applyTeamPreset(presetType) {
  const presets = {
    slogan: ['1팀 (열정 Red)', '2팀 (지혜 Blue)', '3팀 (화합 Green)', '4팀 (희망 Yellow)'],
    color: ['레드팀 (Red)', '블루팀 (Blue)', '그린팀 (Green)', '옐로우팀 (Yellow)'],
    alphabet: ['A팀', 'B팀', 'C팀', 'D팀'],
    korean: ['청팀 (Blue)', '백팀 (White)', '홍팀 (Red)', '녹팀 (Green)']
  };

  const list = presets[presetType];
  if (!list) return;

  for (let i = 1; i <= 4; i++) {
    state.teams[i].name = list[i - 1];
  }

  saveToStorage();
  renderAll();
  showToast(`팀 이름이 [${presetType}] 프리셋으로 변경되었습니다!`);
}

function autoAssignTeams(mode = 'balanced', notify = true) {
  if (state.roster.length === 0) {
    if (notify) alert('팀에 배정할 인원이 없습니다. 인원을 먼저 입력해주세요.');
    return;
  }

  if (mode === 'balanced') {
    // Group by grade to distribute evenly among 4 teams
    const gradeGroups = {};
    state.roster.forEach(p => {
      if (!gradeGroups[p.grade]) gradeGroups[p.grade] = [];
      gradeGroups[p.grade].push(p);
    });

    // Shuffle within each grade group, then distribute round-robin to teams 1,2,3,4
    let currentTeam = 1;
    for (let grade in gradeGroups) {
      const group = gradeGroups[grade];
      shuffleArray(group);
      group.forEach(player => {
        player.team = currentTeam;
        currentTeam = (currentTeam % 4) + 1;
      });
    }
    if (notify) showToast('학년별로 4개 팀에 균등 배정되었습니다 ⚖️');
  } else if (mode === 'random') {
    // Total random shuffle
    const copy = [...state.roster];
    shuffleArray(copy);
    copy.forEach((player, idx) => {
      player.team = (idx % 4) + 1;
    });
    if (notify) showToast('4개 팀에 무작위 추첨 배정되었습니다 🎲');
  }

  saveToStorage();
  renderRosterTable();
  renderTeamsBoxes();
}

function clearTeamAssignments() {
  state.roster.forEach(p => p.team = null);
  saveToStorage();
  renderRosterTable();
  renderTeamsBoxes();
  showToast('모든 팀 배정이 초기화되었습니다.');
}

// Drag & Drop
let draggedPlayerId = null;

function handleDragStart(e, playerId) {
  draggedPlayerId = playerId;
  e.dataTransfer.setData('text/plain', playerId);
  e.dataTransfer.effectAllowed = 'move';
}

function allowDrop(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const box = e.currentTarget;
  box.classList.add('drag-over');
}

function handleDrop(e, targetTeamId) {
  e.preventDefault();
  const box = e.currentTarget;
  box.classList.remove('drag-over');

  const playerId = e.dataTransfer.getData('text/plain') || draggedPlayerId;
  if (!playerId) return;

  const player = state.roster.find(p => p.id === playerId);
  if (player) {
    player.team = targetTeamId;
    saveToStorage();
    renderRosterTable();
    renderTeamsBoxes();
    showToast(`${player.name} 선수가 ${state.teams[targetTeamId].name}으로 이동되었습니다.`);
  }
}

// Remove drag-over class on dragleave
document.addEventListener('dragleave', (e) => {
  if (e.target.classList && e.target.classList.contains('team-box')) {
    e.target.classList.remove('drag-over');
  }
});

// ==========================================
// 7. MATCH GENERATION & CONFIG (경기 수 조절)
// ==========================================

function onMatchModeChange(mode) {
  state.matchMode = mode;
  const customCtrl = document.getElementById('customMatchCtrl');
  if (customCtrl) {
    customCtrl.style.display = mode === 'custom' ? 'flex' : 'none';
  }

  // Update radio cards styling
  document.querySelectorAll('.mode-radio-card').forEach(card => {
    const radio = card.querySelector('input[type="radio"]');
    if (radio && radio.value === mode) {
      card.classList.add('active');
      radio.checked = true;
    } else {
      card.classList.remove('active');
    }
  });

  generateMatches(mode, state.customMatchCount);
  saveToStorage();
  renderScheduleList();
}

function adjustCustomMatchCount(delta) {
  let count = state.customMatchCount + delta;
  if (count < 1) count = 1;
  if (count > 24) count = 24;
  updateCustomMatchCount(count);
}

function updateCustomMatchCount(val) {
  state.customMatchCount = parseInt(val) || 5;
  document.getElementById('customCountInput').value = state.customMatchCount;
  if (state.matchMode === 'custom') {
    generateMatches('custom', state.customMatchCount);
    saveToStorage();
    renderScheduleList();
  }
}

function generateMatches(mode, count = 6) {
  const newMatches = [];

  if (mode === 'league') {
    // 4 Teams Full League: 6 matches (4C2)
    // Round 1: 1 vs 2, 3 vs 4
    // Round 2: 1 vs 3, 2 vs 4
    // Round 3: 1 vs 4, 2 vs 3
    const pairs = [
      { home: 1, away: 2, name: '제1경기 (1팀 vs 2팀)' },
      { home: 3, away: 4, name: '제2경기 (3팀 vs 4팀)' },
      { home: 1, away: 3, name: '제3경기 (1팀 vs 3팀)' },
      { home: 2, away: 4, name: '제4경기 (2팀 vs 4팀)' },
      { home: 1, away: 4, name: '제5경기 (1팀 vs 4팀)' },
      { home: 2, away: 3, name: '제6경기 (2팀 vs 3팀)' }
    ];
    pairs.forEach((p, idx) => {
      newMatches.push(createMatchObject(idx + 1, p.name, p.home, p.away));
    });
  } else if (mode === 'tournament') {
    // 4 Matches: Semi 1, Semi 2, 3rd place match, Final
    const tourn = [
      { home: 1, away: 2, name: '준결승 1경기 (1팀 vs 2팀)' },
      { home: 3, away: 4, name: '준결승 2경기 (3팀 vs 4팀)' },
      { home: 2, away: 4, name: '3·4위 결정전' },
      { home: 1, away: 3, name: '대망의 결승전 🏆' }
    ];
    tourn.forEach((p, idx) => {
      newMatches.push(createMatchObject(idx + 1, p.name, p.home, p.away));
    });
  } else if (mode === 'double') {
    // Double Round Robin: 12 matches
    let mIdx = 1;
    for (let r = 1; r <= 2; r++) {
      const pairs = [
        { home: 1, away: 2 }, { home: 3, away: 4 },
        { home: 1, away: 3 }, { home: 2, away: 4 },
        { home: 1, away: 4 }, { home: 2, away: 3 }
      ];
      pairs.forEach(p => {
        newMatches.push(createMatchObject(mIdx, `${r}차전 제${mIdx}경기`, p.home, p.away));
        mIdx++;
      });
    }
  } else if (mode === 'custom') {
    // Custom N matches cycling through combinations
    const pairs = [
      { home: 1, away: 2 }, { home: 3, away: 4 },
      { home: 1, away: 3 }, { home: 2, away: 4 },
      { home: 1, away: 4 }, { home: 2, away: 3 }
    ];
    for (let i = 0; i < count; i++) {
      const p = pairs[i % pairs.length];
      newMatches.push(createMatchObject(i + 1, `제${i + 1}경기`, p.home, p.away));
    }
  }

  state.matches = newMatches;
  state.activeMatchId = newMatches.length > 0 ? newMatches[0].id : null;
}

function createMatchObject(id, name, homeTeamId, awayTeamId) {
  return {
    id: id,
    name: name,
    homeTeamId: homeTeamId,
    awayTeamId: awayTeamId,
    homeScore: 0,
    awayScore: 0,
    status: 'waiting', // 'waiting' | 'playing' | 'done'
    events: [] // [{ id, type: 'goal', teamSide: 'home'|'away', teamId, scorerId, scorerName, assistId, assistName, time }]
  };
}

// Rules Configuration
function toggleRulesConfig() {
  const drawer = document.getElementById('rulesDrawer');
  drawer.style.display = drawer.style.display === 'none' ? 'grid' : 'none';
}

function saveRulesConfig() {
  state.rules.winPts = parseInt(document.getElementById('ruleWinPts').value) || 3;
  state.rules.drawPts = parseInt(document.getElementById('ruleDrawPts').value) || 1;
  state.rules.goalPts = parseInt(document.getElementById('ruleGoalPts').value) || 1;
  state.rules.assistPts = parseInt(document.getElementById('ruleAssistPts').value) || 1;
  state.rules.fairPts = parseInt(document.getElementById('ruleFairPts').value) || 1;

  document.getElementById('rulesSummary').innerHTML = `
    <span>팀 승리: <strong>+${state.rules.winPts}점</strong></span> · 
    <span>팀 무승부: <strong>+${state.rules.drawPts}점</strong></span> · 
    <span>팀 패배: <strong>0점</strong></span> · 
    <span>개인 득점(골): <strong>+${state.rules.goalPts}점/골</strong></span> · 
    <span>도움: <strong>+${state.rules.assistPts}점/도움</strong></span>
  `;

  document.getElementById('rulesDrawer').style.display = 'none';
  saveToStorage();
  renderLeaderboard();
  showToast('승점 부여 규칙이 저장되었습니다.');
}

// ==========================================
// 8. START TOURNAMENT (ENTER TRIGGER)
// ==========================================

function startTournament() {
  // Check if roster has members
  if (state.roster.length === 0) {
    alert('참가자 인원이 없습니다. 인원 시트에 먼저 인원을 추가하거나 [사제동행 명단 로드]를 눌러주세요.');
    return;
  }

  // Check if all roster members are assigned to a team
  const unassigned = state.roster.filter(p => !p.team);
  if (unassigned.length > 0) {
    if (confirm(`아직 팀이 배정되지 않은 선수(${unassigned.length}명)가 있습니다.\n'학년별 균등 배정'으로 자동 팀 배정을 진행하고 경기를 시작하시겠습니까?`)) {
      autoAssignTeams('balanced', false);
    } else {
      return;
    }
  }

  // If matches empty, regenerate
  if (!state.matches || state.matches.length === 0) {
    generateMatches(state.matchMode, state.customMatchCount);
  }

  if (!state.activeMatchId && state.matches.length > 0) {
    state.activeMatchId = state.matches[0].id;
  }

  saveToStorage();
  switchView('match');
  playWhistleSound();
  showToast('⚽ 축구 경기가 시작되었습니다! 멋진 플레이를 기대합니다!');
}

// ==========================================
// 9. MATCH PLAY & SCOREBOARD (스코어보드 & 대진)
// ==========================================

function renderMatchView() {
  renderActiveScoreboard();
  renderScheduleList();
  renderStandings();
  renderLeaderboard();
  updateProgressText();
}

function updateProgressText() {
  const completed = state.matches.filter(m => m.status === 'done').length;
  const total = state.matches.length;
  document.getElementById('matchProgressText').textContent = `진행도: ${completed} / ${total} 경기 완료`;
  document.getElementById('scheduleCount').textContent = `총 ${total}경기`;
}

function renderActiveScoreboard() {
  const match = state.matches.find(m => m.id === state.activeMatchId);
  if (!match) return;

  const homeTeam = state.teams[match.homeTeamId];
  const awayTeam = state.teams[match.awayTeamId];

  document.getElementById('activeMatchBadge').textContent = `현재 경기: ${match.name}`;
  
  const statusEl = document.getElementById('activeMatchStatus');
  if (match.status === 'done') {
    statusEl.textContent = '종료된 경기 (결과 확정)';
    statusEl.style.color = '#34d399';
    document.getElementById('finishMatchBtn').textContent = '🔄 경기 결과 재확정';
  } else if (match.status === 'playing') {
    statusEl.textContent = '⚽ 경기 진행중';
    statusEl.style.color = '#38bdf8';
    document.getElementById('finishMatchBtn').textContent = '✅ 경기 종료 및 개인 승점 반영';
  } else {
    statusEl.textContent = '대기중';
    statusEl.style.color = 'var(--text-secondary)';
    document.getElementById('finishMatchBtn').textContent = '✅ 경기 종료 및 개인 승점 반영';
  }

  // Home
  document.getElementById('activeHomeBadge').textContent = `${homeTeam.id}팀`;
  document.getElementById('activeHomeName').textContent = homeTeam.name;
  document.getElementById('activeHomeScore').textContent = match.homeScore;

  // Away
  document.getElementById('activeAwayBadge').textContent = `${awayTeam.id}팀`;
  document.getElementById('activeAwayName').textContent = awayTeam.name;
  document.getElementById('activeAwayScore').textContent = match.awayScore;

  // Render events list
  const eventsListEl = document.getElementById('matchEventsList');
  if (match.events.length === 0) {
    eventsListEl.textContent = '골 기록이 없습니다. [+ 골] 또는 [⚽ 득점자 기록]을 눌러 기록하세요.';
  } else {
    eventsListEl.innerHTML = match.events.map((ev, i) => `
      <span class="event-tag" style="background: rgba(255,255,255,0.08); padding: 2px 8px; border-radius: 4px; margin-right: 4px; display: inline-block;">
        ⚽ <strong>${escapeHtml(ev.scorerName)}</strong>${ev.assistName ? ` (도움: ${escapeHtml(ev.assistName)})` : ''}
        <button onclick="removeMatchEvent(${i})" style="background:none; border:none; color:#f87171; cursor:pointer; margin-left:4px;">✕</button>
      </span>
    `).join(' ');
  }
}

function selectActiveMatch(matchId) {
  state.activeMatchId = matchId;
  saveToStorage();
  renderActiveScoreboard();
  renderScheduleList();
}

function adjustActiveScore(teamSide, delta) {
  const match = state.matches.find(m => m.id === state.activeMatchId);
  if (!match) return;

  if (teamSide === 'home') {
    match.homeScore = Math.max(0, match.homeScore + delta);
  } else {
    match.awayScore = Math.max(0, match.awayScore + delta);
  }

  if (match.status === 'waiting') {
    match.status = 'playing';
  }

  saveToStorage();
  renderActiveScoreboard();
  renderScheduleList();
  renderStandings();
  renderLeaderboard();
}

function finishActiveMatch() {
  const match = state.matches.find(m => m.id === state.activeMatchId);
  if (!match) return;

  match.status = 'done';
  playWhistleSound();

  // Automatically find next waiting match and suggest
  const nextMatch = state.matches.find(m => m.status === 'waiting');
  
  saveToStorage();
  renderAll();
  showToast(`✅ ${match.name}가 종료되었으며, 개인별 승점이 모두 반영되었습니다!`);

  if (nextMatch) {
    setTimeout(() => {
      selectActiveMatch(nextMatch.id);
    }, 600);
  }
}

// Goals and Events Modal
function openGoalModal(teamSide) {
  const match = state.matches.find(m => m.id === state.activeMatchId);
  if (!match) return;

  state.activeGoalModalTeamSide = teamSide;
  const teamId = teamSide === 'home' ? match.homeTeamId : match.awayTeamId;
  const team = state.teams[teamId];
  const members = state.roster.filter(p => p.team === teamId);

  document.getElementById('goalModalTitle').textContent = `⚽ [${team.name}] 득점 및 도움 기록`;

  const scorerSelect = document.getElementById('goalScorerSelect');
  const assistSelect = document.getElementById('goalAssistSelect');

  if (members.length === 0) {
    scorerSelect.innerHTML = `<option value="">(해당 팀에 배정된 선수가 없습니다)</option>`;
    assistSelect.innerHTML = `<option value="">(해당 없음)</option>`;
  } else {
    const options = members.map(p => `
      <option value="${p.id}">[${escapeHtml(p.grade)}] ${escapeHtml(p.name)}</option>
    `).join('');

    scorerSelect.innerHTML = options;
    assistSelect.innerHTML = `<option value="">(도움 없음 / 단독 골)</option>` + options;
  }

  document.getElementById('goalModal').style.display = 'flex';
}

function closeGoalModal() {
  document.getElementById('goalModal').style.display = 'none';
}

function saveGoalRecord() {
  const match = state.matches.find(m => m.id === state.activeMatchId);
  if (!match) return;

  const scorerId = document.getElementById('goalScorerSelect').value;
  const assistId = document.getElementById('goalAssistSelect').value;

  if (!scorerId) {
    alert('득점 선수를 선택해주세요.');
    return;
  }

  const scorer = state.roster.find(p => p.id === scorerId);
  const assist = state.roster.find(p => p.id === assistId);

  const teamSide = state.activeGoalModalTeamSide;
  const teamId = teamSide === 'home' ? match.homeTeamId : match.awayTeamId;

  // Add event
  match.events.push({
    id: 'ev_' + Date.now(),
    type: 'goal',
    teamSide: teamSide,
    teamId: teamId,
    scorerId: scorerId,
    scorerName: scorer ? scorer.name : '선수',
    assistId: assistId || null,
    assistName: assist ? assist.name : null
  });

  // Increment score
  if (teamSide === 'home') {
    match.homeScore++;
  } else {
    match.awayScore++;
  }

  if (match.status === 'waiting') {
    match.status = 'playing';
  }

  saveToStorage();
  closeGoalModal();
  renderActiveScoreboard();
  renderScheduleList();
  renderStandings();
  renderLeaderboard();
  showToast(`⚽ ${scorer ? scorer.name : ''} 선수의 멋진 골이 기록되었습니다! (+1점)`);
}

function removeMatchEvent(eventIndex) {
  const match = state.matches.find(m => m.id === state.activeMatchId);
  if (!match || !match.events[eventIndex]) return;

  const ev = match.events[eventIndex];
  if (ev.teamSide === 'home') {
    match.homeScore = Math.max(0, match.homeScore - 1);
  } else {
    match.awayScore = Math.max(0, match.awayScore - 1);
  }

  match.events.splice(eventIndex, 1);
  saveToStorage();
  renderActiveScoreboard();
  renderScheduleList();
  renderStandings();
  renderLeaderboard();
}

// Schedule List Render
function renderScheduleList() {
  const container = document.getElementById('scheduleList');
  if (!container) return;

  container.innerHTML = state.matches.map((m, idx) => {
    const home = state.teams[m.homeTeamId];
    const away = state.teams[m.awayTeamId];
    const isActive = m.id === state.activeMatchId;
    const isDone = m.status === 'done';

    let statusTag = '<span class="status-tag waiting">대기</span>';
    if (m.status === 'playing') statusTag = '<span class="status-tag playing">진행중</span>';
    if (m.status === 'done') statusTag = '<span class="status-tag done">종료</span>';

    return `
      <div class="match-item ${isActive ? 'active' : ''} ${isDone ? 'completed' : ''}" onclick="selectActiveMatch(${m.id})">
        <div class="match-item-info">
          <span class="match-item-title">${escapeHtml(m.name)}</span>
          <div class="match-item-teams">
            <span>${escapeHtml(home.name)}</span>
            <span class="vs-mini" style="font-size:11px; color:var(--text-muted);">vs</span>
            <span>${escapeHtml(away.name)}</span>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="match-item-score">${m.homeScore} : ${m.awayScore}</div>
          ${statusTag}
        </div>
      </div>
    `;
  }).join('');
}

// Add Match Modal
function addNewMatchModal() {
  const homeSelect = document.getElementById('newMatchHome');
  const awaySelect = document.getElementById('newMatchAway');

  const options = Object.values(state.teams).map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('');
  homeSelect.innerHTML = options;
  awaySelect.innerHTML = options;
  awaySelect.value = '2';

  document.getElementById('addMatchModal').style.display = 'flex';
}

function closeAddMatchModal() {
  document.getElementById('addMatchModal').style.display = 'none';
}

function confirmAddMatch() {
  const homeId = parseInt(document.getElementById('newMatchHome').value);
  const awayId = parseInt(document.getElementById('newMatchAway').value);

  if (homeId === awayId) {
    alert('홈 팀과 어웨이 팀은 서로 다른 팀이어야 합니다.');
    return;
  }

  const newId = state.matches.length > 0 ? Math.max(...state.matches.map(m => m.id)) + 1 : 1;
  const newMatch = createMatchObject(newId, `제${newId}경기 (${state.teams[homeId].name} vs ${state.teams[awayId].name})`, homeId, awayId);

  state.matches.push(newMatch);
  saveToStorage();
  closeAddMatchModal();
  renderScheduleList();
  updateProgressText();
  showToast('새 축구 경기가 추가되었습니다.');
}

// ==========================================
// 10. TIMER & WHISTLE SOUND (Web Audio API)
// ==========================================

function toggleTimer() {
  if (state.timer.isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  if (state.timer.isRunning) return;

  state.timer.isRunning = true;
  document.getElementById('timerStartBtn').textContent = '⏸ 일시정지';
  playWhistleSound(false);

  state.timer.intervalId = setInterval(() => {
    if (state.timer.remaining > 0) {
      state.timer.remaining--;
      updateTimerDisplay();
    } else {
      pauseTimer();
      playWhistleSound(true);
      alert('⏰ 경기 시간이 모두 종료되었습니다! (휘슬 울림)');
    }
  }, 1000);
}

function pauseTimer() {
  state.timer.isRunning = false;
  if (state.timer.intervalId) {
    clearInterval(state.timer.intervalId);
    state.timer.intervalId = null;
  }
  document.getElementById('timerStartBtn').textContent = '▶ 재개';
}

function resetTimer() {
  pauseTimer();
  state.timer.remaining = state.timer.duration;
  updateTimerDisplay();
  document.getElementById('timerStartBtn').textContent = '▶ 시작';
}

function adjustTimerDuration(deltaMinutes) {
  state.timer.duration = Math.max(60, state.timer.duration + (deltaMinutes * 60));
  state.timer.remaining = state.timer.duration;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const mins = Math.floor(state.timer.remaining / 60);
  const secs = state.timer.remaining % 60;
  const str = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  document.getElementById('timerDisplay').textContent = str;
}

// Web Audio API Whistle (Pure Audio Synthesis, No external audio file needed!)
function playWhistleSound(isFinalWhistle = false) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sine';

    // Whistle dual frequencies (~2500Hz & ~2800Hz with vibrato)
    osc1.frequency.setValueAtTime(2550, ctx.currentTime);
    osc2.frequency.setValueAtTime(2850, ctx.currentTime);

    const now = ctx.currentTime;
    const duration = isFinalWhistle ? 1.4 : 0.45;

    gainNode.gain.setValueAtTime(0.01, now);
    gainNode.gain.exponentialRampToValueAtTime(0.3, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);

    if (isFinalWhistle) {
      // Play second and third long whistle
      setTimeout(() => playWhistleSound(false), 550);
      setTimeout(() => playWhistleSound(false), 1100);
    }
  } catch (e) {
    console.log('Audio error:', e);
  }
}

// ==========================================
// 11. STANDINGS & INDIVIDUAL POINTS CALCULATION (핵심 승점 산정)
// ==========================================

function calculateStats() {
  // 1. Team stats calculation
  const teamStats = {
    1: { id: 1, played: 0, win: 0, draw: 0, loss: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    2: { id: 2, played: 0, win: 0, draw: 0, loss: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    3: { id: 3, played: 0, win: 0, draw: 0, loss: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    4: { id: 4, played: 0, win: 0, draw: 0, loss: 0, gf: 0, ga: 0, gd: 0, pts: 0 }
  };

  // 2. Player stats calculation
  const playerStats = {};
  state.roster.forEach(p => {
    playerStats[p.id] = {
      player: p,
      played: 0,
      win: 0,
      draw: 0,
      loss: 0,
      goals: 0,
      assists: 0,
      fairPlay: p.fairPlay || 0,
      totalPts: 0
    };
  });

  // Process all matches (even active matches or done matches with scores)
  state.matches.forEach(m => {
    // We count matches that are 'done' or 'playing' with scores
    if (m.status === 'done' || (m.status === 'playing' && (m.homeScore > 0 || m.awayScore > 0))) {
      const hId = m.homeTeamId;
      const aId = m.awayTeamId;

      if (teamStats[hId] && teamStats[aId]) {
        teamStats[hId].played++;
        teamStats[aId].played++;
        teamStats[hId].gf += m.homeScore;
        teamStats[hId].ga += m.awayScore;
        teamStats[aId].gf += m.awayScore;
        teamStats[aId].ga += m.homeScore;

        let homeResult = 'draw';
        let awayResult = 'draw';

        if (m.homeScore > m.awayScore) {
          teamStats[hId].win++;
          teamStats[hId].pts += state.rules.winPts;
          teamStats[aId].loss++;
          homeResult = 'win';
          awayResult = 'loss';
        } else if (m.homeScore < m.awayScore) {
          teamStats[aId].win++;
          teamStats[aId].pts += state.rules.winPts;
          teamStats[hId].loss++;
          homeResult = 'loss';
          awayResult = 'win';
        } else {
          teamStats[hId].draw++;
          teamStats[hId].pts += state.rules.drawPts;
          teamStats[aId].draw++;
          teamStats[aId].pts += state.rules.drawPts;
        }

        // Apply team result to players of that team
        state.roster.forEach(p => {
          if (p.team === hId && playerStats[p.id]) {
            playerStats[p.id].played++;
            if (homeResult === 'win') playerStats[p.id].win++;
            if (homeResult === 'draw') playerStats[p.id].draw++;
            if (homeResult === 'loss') playerStats[p.id].loss++;
          } else if (p.team === aId && playerStats[p.id]) {
            playerStats[p.id].played++;
            if (awayResult === 'win') playerStats[p.id].win++;
            if (awayResult === 'draw') playerStats[p.id].draw++;
            if (awayResult === 'loss') playerStats[p.id].loss++;
          }
        });
      }
    }

    // Process events (goals & assists)
    m.events.forEach(ev => {
      if (ev.scorerId && playerStats[ev.scorerId]) {
        playerStats[ev.scorerId].goals++;
      }
      if (ev.assistId && playerStats[ev.assistId]) {
        playerStats[ev.assistId].assists++;
      }
    });
  });

  // Calculate goal differences for teams
  for (let id in teamStats) {
    teamStats[id].gd = teamStats[id].gf - teamStats[id].ga;
  }

  // Calculate total points for each individual player
  for (let pId in playerStats) {
    const ps = playerStats[pId];
    ps.totalPts = 
      (ps.win * state.rules.winPts) +
      (ps.draw * state.rules.drawPts) +
      (ps.goals * state.rules.goalPts) +
      (ps.assists * state.rules.assistPts) +
      (ps.fairPlay * state.rules.fairPts);
  }

  return { teamStats, playerStats };
}

function renderStandings() {
  const tbody = document.getElementById('standingsTbody');
  if (!tbody) return;

  const { teamStats } = calculateStats();

  // Sort teams: 1. Pts, 2. GD, 3. GF
  const sorted = Object.values(teamStats).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });

  tbody.innerHTML = sorted.map((t, idx) => {
    const teamObj = state.teams[t.id];
    let rankBadge = `<span class="rank-medal rank-${idx + 1}">${idx + 1}</span>`;
    return `
      <tr>
        <td>${rankBadge}</td>
        <td style="text-align: left; font-weight: 700;">${escapeHtml(teamObj.name)}</td>
        <td>${t.played}</td>
        <td>${t.win}</td>
        <td>${t.draw}</td>
        <td>${t.loss}</td>
        <td>${t.gf}</td>
        <td>${t.ga}</td>
        <td>${t.gd > 0 ? '+' + t.gd : t.gd}</td>
        <td class="td-highlight">${t.pts}</td>
      </tr>
    `;
  }).join('');
}

function filterLeaderboard(grade, btn) {
  state.activeLeaderboardFilter = grade;
  document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderLeaderboard();
}

function renderLeaderboard() {
  const tbody = document.getElementById('leaderboardTbody');
  if (!tbody) return;

  const { playerStats } = calculateStats();
  const sortMode = document.getElementById('leaderboardSort').value || 'points';

  let list = Object.values(playerStats);

  // Apply Grade Filter
  if (state.activeLeaderboardFilter !== 'all') {
    list = list.filter(item => {
      if (state.activeLeaderboardFilter === '교사') {
        return item.player.grade.includes('교사') || item.player.grade.includes('교원');
      }
      return item.player.grade.includes(state.activeLeaderboardFilter);
    });
  }

  // Sort List
  list.sort((a, b) => {
    if (sortMode === 'points') {
      if (b.totalPts !== a.totalPts) return b.totalPts - a.totalPts;
      if (b.goals !== a.goals) return b.goals - a.goals;
      if (b.assists !== a.assists) return b.assists - a.assists;
      return a.player.no - b.player.no;
    } else if (sortMode === 'goals') {
      if (b.goals !== a.goals) return b.goals - a.goals;
      return b.totalPts - a.totalPts;
    } else if (sortMode === 'assists') {
      if (b.assists !== a.assists) return b.assists - a.assists;
      return b.totalPts - a.totalPts;
    } else if (sortMode === 'name') {
      return a.player.name.localeCompare(b.player.name);
    } else if (sortMode === 'no') {
      return a.player.no - b.player.no;
    }
    return 0;
  });

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="14" style="text-align: center; padding: 24px; color: var(--text-muted);">표시할 선수가 없습니다.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((item, idx) => {
    const p = item.player;
    const teamObj = p.team ? state.teams[p.team] : null;
    const teamName = teamObj ? teamObj.name : '미배정';

    let rankBadge = `<span class="rank-other">${idx + 1}</span>`;
    if (idx === 0) rankBadge = `<span class="rank-medal rank-1">🥇 1</span>`;
    else if (idx === 1) rankBadge = `<span class="rank-medal rank-2">🥈 2</span>`;
    else if (idx === 2) rankBadge = `<span class="rank-medal rank-3">🥉 3</span>`;

    return `
      <tr>
        <td>${rankBadge}</td>
        <td>${p.no}</td>
        <td><span class="badge-grade ${p.grade === '교사' ? 'badge-teacher' : ''}">${escapeHtml(p.grade)}</span></td>
        <td>
          <div class="player-name-cell">
            <span>${escapeHtml(p.name)}</span>
            ${idx === 0 ? '<span class="mvp-star" title="현재 승점 1위 MVP">★</span>' : ''}
          </div>
        </td>
        <td>
          <span style="font-size: 12px; color: var(--text-secondary);">${escapeHtml(teamName)}</span>
        </td>
        <td>${item.played}</td>
        <td>${item.win}</td>
        <td>${item.draw}</td>
        <td>${item.loss}</td>
        <td style="font-weight: 700; color: #38bdf8;">${item.goals}</td>
        <td style="color: #cbd5e1;">${item.assists}</td>
        <td style="color: #f472b6;">${item.fairPlay}</td>
        <td class="td-pts">${item.totalPts}</td>
        <td>
          <div style="display: flex; gap: 4px; justify-content: center;">
            <button class="btn-xs btn-outline" onclick="quickAwardPlayer('${p.id}', 'fairPlay')" title="페어플레이/배려 보너스 +1">❤️+1</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function quickAwardPlayer(playerId, statType) {
  const player = state.roster.find(p => p.id === playerId);
  if (!player) return;

  if (statType === 'fairPlay') {
    player.fairPlay = (player.fairPlay || 0) + 1;
    saveToStorage();
    renderLeaderboard();
    showToast(`👏 ${player.name} 선수에게 페어플레이 보너스(+1점)가 부여되었습니다!`);
  }
}

// ==========================================
// 12. EXPORT CSV & PRINT VIEW PREPARATION
// ==========================================

function exportToCSV() {
  const { playerStats, teamStats } = calculateStats();

  let csv = '\uFEFF'; // UTF-8 BOM for Korean Excel compatibility
  
  // 1. Title
  csv += '2026학년도 학교폭력예방을 위한 「사제동행 체육활동」 축구 경기 결과표\n\n';

  // 2. Team Standings
  csv += '[팀 순위표]\n';
  csv += '순위,팀명,경기수,승,무,패,득점,실점,득실차,승점\n';
  const sortedTeams = Object.values(teamStats).sort((a, b) => b.pts - a.pts || b.gd - a.gd);
  sortedTeams.forEach((t, i) => {
    csv += `${i + 1},"${state.teams[t.id].name}",${t.played},${t.win},${t.draw},${t.loss},${t.gf},${t.ga},${t.gd},${t.pts}\n`;
  });
  csv += '\n';

  // 3. Match Results
  csv += '[경기별 대진 및 결과]\n';
  csv += '경기,홈팀,스코어,어웨이팀,상태,득점기록\n';
  state.matches.forEach(m => {
    const eventsStr = m.events.map(e => `${e.scorerName}${e.assistName ? '(' + e.assistName + ')' : ''}`).join('; ');
    csv += `"${m.name}","${state.teams[m.homeTeamId].name}",${m.homeScore}:${m.awayScore},"${state.teams[m.awayTeamId].name}",${m.status === 'done' ? '종료' : '진행전'},"${eventsStr}"\n`;
  });
  csv += '\n';

  // 4. Individual Leaderboard
  csv += '[개인별 승점 및 세부 기록]\n';
  csv += '순위,연번,학년,이름,소속팀,출전경기,승,무,패,골,도움,페어플레이점수,총승점(PTS)\n';
  const sortedPlayers = Object.values(playerStats).sort((a, b) => b.totalPts - a.totalPts || b.goals - a.goals);
  sortedPlayers.forEach((item, i) => {
    const p = item.player;
    const teamName = p.team ? state.teams[p.team].name : '미배정';
    csv += `${i + 1},${p.no},"${p.grade}","${p.name}","${teamName}",${item.played},${item.win},${item.draw},${item.loss},${item.goals},${item.assists},${item.fairPlay},${item.totalPts}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `사제동행_축구_대진표_및_개인승점_결과_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('💾 엑셀(CSV) 파일이 정상적으로 다운로드되었습니다.');
}

// Print Handler (Setup Print-only content dynamically before print dialog opens)
window.onbeforeprint = () => {
  const { playerStats, teamStats } = calculateStats();

  // Print Date
  const dateMeta = document.getElementById('printDateMeta');
  if (dateMeta) {
    const now = new Date();
    dateMeta.textContent = `출력일시: ${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 | 대상: 학생 및 인솔교사 | 종목: 축구`;
  }

  // 1. Team Table
  const teamDiv = document.getElementById('printTeamTable');
  if (teamDiv) {
    const sortedTeams = Object.values(teamStats).sort((a, b) => b.pts - a.pts || b.gd - a.gd);
    teamDiv.innerHTML = `
      <table>
        <thead>
          <tr><th>순위</th><th>팀명</th><th>경기</th><th>승</th><th>무</th><th>패</th><th>득</th><th>실</th><th>득실</th><th>승점</th></tr>
        </thead>
        <tbody>
          ${sortedTeams.map((t, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td>${escapeHtml(state.teams[t.id].name)}</td>
              <td>${t.played}</td>
              <td>${t.win}</td>
              <td>${t.draw}</td>
              <td>${t.loss}</td>
              <td>${t.gf}</td>
              <td>${t.ga}</td>
              <td>${t.gd}</td>
              <td><strong>${t.pts}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  // 2. Match Table
  const matchDiv = document.getElementById('printMatchTable');
  if (matchDiv) {
    matchDiv.innerHTML = `
      <table>
        <thead>
          <tr><th>경기</th><th>대진</th><th>결과</th><th>득점자 기록</th></tr>
        </thead>
        <tbody>
          ${state.matches.map(m => `
            <tr>
              <td>${escapeHtml(m.name)}</td>
              <td>${escapeHtml(state.teams[m.homeTeamId].name)} vs ${escapeHtml(state.teams[m.awayTeamId].name)}</td>
              <td><strong>${m.homeScore} : ${m.awayScore}</strong></td>
              <td>${m.events.map(e => `${e.scorerName}${e.assistName ? '(도움:' + e.assistName + ')' : ''}`).join(', ') || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  // 3. Player Leaderboard Table
  const playerDiv = document.getElementById('printPlayerTable');
  if (playerDiv) {
    const sortedPlayers = Object.values(playerStats).sort((a, b) => b.totalPts - a.totalPts || b.goals - a.goals);
    playerDiv.innerHTML = `
      <table>
        <thead>
          <tr><th>순위</th><th>연번</th><th>학년</th><th>이름</th><th>소속팀</th><th>경기</th><th>승</th><th>무</th><th>패</th><th>골</th><th>도움</th><th>페어플레이</th><th>총 승점</th></tr>
        </thead>
        <tbody>
          ${sortedPlayers.map((item, idx) => `
            <tr>
              <td><strong>${idx + 1}</strong></td>
              <td>${item.player.no}</td>
              <td>${escapeHtml(item.player.grade)}</td>
              <td>${escapeHtml(item.player.name)}</td>
              <td>${item.player.team ? escapeHtml(state.teams[item.player.team].name) : '-'}</td>
              <td>${item.played}</td>
              <td>${item.win}</td>
              <td>${item.draw}</td>
              <td>${item.loss}</td>
              <td>${item.goals}</td>
              <td>${item.assists}</td>
              <td>${item.fairPlay}</td>
              <td><strong>${item.totalPts}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
};

// ==========================================
// 13. UTILITIES & TOAST
// ==========================================

function renderAll() {
  renderRosterTable();
  renderTeamsBoxes();
  renderScheduleList();
  renderActiveScoreboard();
  renderStandings();
  renderLeaderboard();
  updateProgressText();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = msg;
  toast.classList.add('show');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}
