// ==================== 성도 관리 ====================


// 이모지 리스트 (프로필 기본 아이콘)
const emo_list = ['🙏', '✝', '⛪', '📖', '🕊', '🌿', '🌸', '🌟'];


let currentMemberId = null;  // 현재 선택된 성도 ID


// 성도 등록 모달 열기
function openAddMember() {
  document.getElementById('m-name').value = '';
  document.getElementById('m-phone').value = '';
  document.getElementById('m-dept').selectedIndex = 0;
  document.getElementById('m-birth').value = '';
  document.getElementById('m-date').value = new Date().toISOString().slice(0, 10);
  document.getElementById('m-note').value = '';
  document.getElementById('modal-member').style.display = 'flex';
}


// 성도 저장 (등록)
function saveMember() {
  const name = document.getElementById('m-name').value.trim();
  if (!name) { showToast('이름을 입력하세요'); return; }
  
  const newMember = {
    id: Date.now(),
    name: name,
    phone: document.getElementById('m-phone').value.trim(),
    dept: document.getElementById('m-dept').value,
    birth: document.getElementById('m-birth').value,
    date: document.getElementById('m-date').value,
    note: document.getElementById('m-note').value.trim(),
    isNew: document.getElementById('m-dept').value === '새신자',
    photo: '',
    role: document.getElementById('m-role') ? document.getElementById('m-role').value : 'member'
  };
  
  members.push(newMember);
  LS.save('members', members);
  
  // approvedUsers에도 추가 (로그인 가능하도록)
  const existingUser = approvedUsers.find(u => u.name === name && u.phone === newMember.phone);
  if (!existingUser) {
    approvedUsers.push({
      id: name.toLowerCase() + Date.now(),
      pw: 'default123',
      name: name,
      email: '',
      phone: newMember.phone,
      birth: newMember.birth,
      role: newMember.role,
      isManual: true
    });
    LS.save('approvedUsers', approvedUsers);
  }
  
  closeModal('modal-member');
  renderMembersAccord();
  showToast('✅ 등록되었습니다');
}


// 성도 목록 렌더링 (아코디언 내부)
function renderMembersAccord() {
  const safeMembers = Array.isArray(members) ? members : [];
  const q = (document.getElementById('member-search') || {}).value || '';
  const filtered = safeMembers.filter(m => !q || (m.name && m.name.includes(q)) || (m.dept && m.dept.includes(q)));
  
  document.getElementById('am-total') && (document.getElementById('am-total').textContent = safeMembers.length);
  document.getElementById('am-new') && (document.getElementById('am-new').textContent = safeMembers.filter(m => m.isNew).length);
  document.getElementById('am-month') && (document.getElementById('am-month').textContent = safeMembers.filter(m => (m.date || '').startsWith(new Date().toISOString().slice(0, 7))).length);
  document.getElementById('ac-member-sub') && (document.getElementById('ac-member-sub').textContent = '전체 ' + safeMembers.length + '명');
  
  const el = document.getElementById('accord-member-list');
  if (!el) return;
  
  if (!filtered.length) {
    el.innerHTML = '<div style="text-align:center;color:var(--text2);padding:16px;">검색 결과가 없습니다</div>';
    return;
  }
  
  el.innerHTML = filtered.map((m, i) => `
    <div class="member-row" onclick="openMemberProfile(${m.id})" style="cursor:pointer;">
      <div class="member-avatar" style="overflow:hidden;">
        ${m.photo ? `<img src="${m.photo}" style="width:100%;height:100%;object-fit:cover;">` : `<span style="font-size:20px;">${emo_list[i % emo_list.length]}</span>`}
      </div>
      <div style="flex:1;">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span class="member-name">${escapeHtml(m.name || '이름 없음')}</span>
          ${m.isNew ? '<span class="member-tag">새신자</span>' : ''}
          ${m.role ? `<span class="member-tag" style="background:${m.role === 'admin' ? '#fef3c7' : '#e0e7ff'}; color:${m.role === 'admin' ? '#92400e' : '#3730a3'};">${roleLabel[m.role] || '일반성도'}</span>` : ''}
        </div>
        <div class="member-info">${escapeHtml(m.dept || '-')} · ${escapeHtml(m.phone || '-')}</div>
        <div class="member-info">${m.birth ? '🎂 ' + escapeHtml(m.birth) + ' · ' : ''}가입일 ${escapeHtml(m.date || '')}</div>
      </div>
      <span style="color:var(--text2);font-size:18px;">›</span>
    </div>
  `).join('');
}


// 성도 프로필 보기
function openMemberProfile(id) {
  const m = members.find(m => m.id === id);
  if (!m) return;
  currentMemberId = id;
  
  document.getElementById('profile-view').style.display = 'block';
  document.getElementById('profile-edit').style.display = 'none';
  document.getElementById('profile-modal-title').textContent = '👤 성도 프로필';
  
  const photoEmoji = document.getElementById('profile-photo-emoji');
  const photoImg = document.getElementById('profile-photo-img');
  const idx = members.indexOf(m);
  if (m.photo) {
    photoEmoji.style.display = 'none';
    photoImg.style.display = 'block';
    photoImg.src = m.photo;
  } else {
    photoEmoji.style.display = 'block';
    photoImg.style.display = 'none';
    photoEmoji.textContent = emo_list[idx % emo_list.length];
  }
  
  document.getElementById('pv-name').textContent = m.name;
  document.getElementById('pv-tag').textContent = m.dept + (m.isNew ? ' · 새신자' : '');
  document.getElementById('pv-phone').textContent = m.phone || '-';
  document.getElementById('pv-dept').textContent = m.dept || '-';
  document.getElementById('pv-role').textContent = roleLabel[m.role] || '일반성도';
  document.getElementById('pv-birth').textContent = m.birth || '-';
  document.getElementById('pv-date').textContent = m.date || '-';
  document.getElementById('pv-note').textContent = m.note || '-';
  
  document.getElementById('modal-member-profile').style.display = 'flex';
}


// 성도 수정 창 열기 (프로필 모달 내)
function openEditMember() {
  const m = members.find(m => m.id === currentMemberId);
  if (!m) return;
  
  document.getElementById('profile-view').style.display = 'none';
  document.getElementById('profile-edit').style.display = 'block';
  document.getElementById('profile-modal-title').textContent = '✏️ 성도 수정';
  
  document.getElementById('em-name').value = m.name || '';
  document.getElementById('em-phone').value = m.phone || '';
  document.getElementById('em-birth').value = m.birth || '';
  document.getElementById('em-date').value = m.date || '';
  document.getElementById('em-note').value = m.note || '';
  
  const sel = document.getElementById('em-dept');
  for (let i = 0; i < sel.options.length; i++) {
    if (sel.options[i].value === m.dept || sel.options[i].text === m.dept) {
      sel.selectedIndex = i;
      break;
    }
  }
  
  const roleSel = document.getElementById('em-role');
  if (roleSel && m.role) {
    for (let i = 0; i < roleSel.options.length; i++) {
      if (roleSel.options[i].value === m.role) {
        roleSel.selectedIndex = i;
        break;
      }
    }
  }
  
  const editEmoji = document.getElementById('edit-photo-emoji');
  const editImg = document.getElementById('edit-photo-img');
  const idx = members.indexOf(m);
  if (m.photo) {
    editEmoji.style.display = 'none';
    editImg.style.display = 'block';
    editImg.src = m.photo;
  } else {
    editEmoji.style.display = 'block';
    editImg.style.display = 'none';
    editEmoji.textContent = emo_list[idx % emo_list.length];
  }
}


// 성도 수정 저장
function saveEditMember() {
  const m = members.find(m => m.id === currentMemberId);
  if (!m) return;
  
  const name = document.getElementById('em-name').value.trim();
  if (!name) { showToast('이름을 입력하세요'); return; }
  const newRole = document.getElementById('em-role') ? document.getElementById('em-role').value : 'member';
  
  m.name = name;
  m.phone = document.getElementById('em-phone').value.trim();
  m.dept = document.getElementById('em-dept').value;
  m.birth = document.getElementById('em-birth').value;
  m.date = document.getElementById('em-date').value;
  m.note = document.getElementById('em-note').value.trim();
  m.isNew = m.dept === '새신자';
  m.role = newRole;
  
  const editImg = document.getElementById('edit-photo-img');
  if (editImg.style.display !== 'none' && editImg.src && editImg.src !== window.location.href) {
    m.photo = editImg.src;
  }
  
  LS.save('members', members);
  
  // approvedUsers 동기화
  const userInApproved = approvedUsers.find(u => u.name === m.name || u.phone === m.phone);
  if (userInApproved) {
    userInApproved.role = newRole;
    userInApproved.name = m.name;
    userInApproved.phone = m.phone;
    userInApproved.birth = m.birth;
    LS.save('approvedUsers', approvedUsers);
  }
  
  if (currentUser && currentUser.name === m.name) {
    currentUser.role = newRole;
    const roleText = roleLabel[newRole];
    document.getElementById('user-role-display').textContent = roleText;
    document.getElementById('setting-user-info').textContent = m.name + ' (' + roleText + ')';
    applyRole(newRole);
  }
  
  closeModal('modal-member-profile');
  renderMembersAccord();
  showToast('✅ 수정되었습니다');
}


// 성도 삭제
function deleteCurrentMember() {
  const m = members.find(m => m.id === currentMemberId);
  if (!m) return;
  if (!confirm(m.name + '님을 삭제하시겠습니까?')) return;
  
  members = members.filter(m => m.id !== currentMemberId);
  LS.save('members', members);
  
  const userToDelete = approvedUsers.find(u => u.name === m.name && u.phone === m.phone);
  if (userToDelete) {
    approvedUsers = approvedUsers.filter(u => u.id !== userToDelete.id);
    LS.save('approvedUsers', approvedUsers);
    
    // Firebase 동기화 (추가)
    if (window.FB_READY && window.FB) {
      window.FB.ref('church/members').set(members);
      window.FB.ref('church/approvedUsers').set(approvedUsers);
    }
  }
  
  closeModal('modal-member-profile');
  renderMembersAccord();
  showToast('🗑 ' + m.name + '님이 삭제되었습니다');
}


// 수정 취소 (프로필 모달)
function cancelEditMember() {
  document.getElementById('profile-view').style.display = 'block';
  document.getElementById('profile-edit').style.display = 'none';
  document.getElementById('profile-modal-title').textContent = '👤 성도 프로필';
  openMemberProfile(currentMemberId);
}


// 프로필 사진 미리보기 (수정 모달)
function previewPhoto(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = document.getElementById('edit-photo-img');
    const emoji = document.getElementById('edit-photo-emoji');
    img.src = e.target.result;
    img.style.display = 'block';
    emoji.style.display = 'none';
  };
  reader.readAsDataURL(file);
}