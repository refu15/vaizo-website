(function() {
  'use strict';
  var answers = {};
  var currentStep = 1;
  var totalSteps = 5;
  var dots = document.querySelectorAll('.diag-progress-dot');
  var steps = document.querySelectorAll('.diag-step');
  function goToStep(n) {
    currentStep = n;
    steps.forEach(function(s) { s.classList.remove('active'); });
    var target = document.querySelector('[data-step="' + n + '"]');
    if (target) target.classList.add('active');
    dots.forEach(function(d, i) {
      d.classList.remove('active', 'done');
      if (i < n - 1) d.classList.add('done');
      if (i === n - 1) d.classList.add('active');
    });
    window.scrollTo({ top: document.getElementById('diagnosis').offsetTop - 100, behavior: 'smooth' });
  }
  document.querySelectorAll('.diag-step[data-step="1"] .diag-choice, .diag-step[data-step="2"] .diag-choice, .diag-step[data-step="3"] .diag-choice').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var container = this.closest('.diag-choices');
      var key = container.dataset.key;
      container.querySelectorAll('.diag-choice').forEach(function(b) { b.classList.remove('selected'); });
      this.classList.add('selected');
      answers[key] = {
        value: this.dataset.value,
        score: parseInt(this.dataset.score) || 0
      };
      setTimeout(function() { goToStep(currentStep + 1); }, 300);
    });
  });
  var step4Choices = document.querySelectorAll('.diag-step[data-step="4"] .diag-choice');
  var step4Next = document.getElementById('step4-next');
  step4Choices.forEach(function(btn) {
    btn.addEventListener('click', function() {
      this.classList.toggle('selected');
      var selected = document.querySelectorAll('.diag-step[data-step="4"] .diag-choice.selected');
      step4Next.disabled = selected.length === 0;
    });
  });
  step4Next.addEventListener('click', function() {
    var selected = document.querySelectorAll('.diag-step[data-step="4"] .diag-choice.selected');
    answers.pain_areas = [];
    selected.forEach(function(s) { answers.pain_areas.push(s.dataset.value); });
    goToStep(5);
  });
  document.getElementById('step5-submit').addEventListener('click', function() {
    answers.freetext = document.getElementById('freetext').value.trim();
    showResult();
  });
  var TASK_DB = {
    '日報・報告書の作成': { effect: '日報作成業務を完全にAIが代行。人間は最終確認のみ。', priority: 9, hoursPerWeek: 3, elimination: 0.9 },
    '議事録・会議の整理': { effect: '会議→議事録→タスク化→振り分けまで、人間の作業をゼロに。', priority: 9, hoursPerWeek: 4, elimination: 0.85 },
    '提案書・見積書の作成': { effect: '提案書作成業務を丸ごとAIが担当。4時間の業務が消える。', priority: 10, hoursPerWeek: 5, elimination: 0.9 },
    '問い合わせ対応': { effect: '一次対応をAIが完全代行。人間は例外対応のみに集中。', priority: 8, hoursPerWeek: 6, elimination: 0.8 },
    '社内ナレッジの検索・共有': { effect: '情報を探す時間をゼロに。AIが即座に正確な情報を提示。', priority: 7, hoursPerWeek: 3, elimination: 0.85 },
    'Web・LP制作の外注コスト': { effect: '制作・修正業務を完全内製化。外注待ちの時間が消える。', priority: 7, hoursPerWeek: 4, elimination: 0.8 },
    'データ入力・集計': { effect: 'データ入力・集計業務を完全自動化。人間の手作業をゼロに。', priority: 8, hoursPerWeek: 5, elimination: 0.95 },
    '採用・人事業務': { effect: '求人票作成・スクリーニング・記録整理をAIが完全代行。', priority: 6, hoursPerWeek: 4, elimination: 0.7 }
  };
  var PLANS = [
    { name: 'おすすめプラン', title: 'LIGHT', desc: '1業務の自動化 + 基本環境構築 + 30日レビュー', price: '30万円', min: 0, max: 54 },
    { name: 'おすすめプラン', title: 'STANDARD', desc: '複数業務 + 権限設計 + 管理画面 + 60日サポート', price: '50万円', min: 55, max: 74 },
    { name: 'おすすめプラン', title: 'ENTERPRISE', desc: '部門横断 + カスタムUI + セキュリティ監査 + 90日サポート', price: '100万円〜', min: 75, max: 100 }
  ];
  var AI_STATUS_INSIGHTS = {
    'まだ何も使っていない': 'AI未導入の今がチャンスです。競合より先にエージェント型AIを導入することで、大きなアドバンテージが得られます。',
    '個人的に使っている社員がいる': '個人利用から組織利用への移行がカギです。ルール・権限・承認フローを整備し、全社で安全に活用できる体制を構築すべきです。',
    'ChatGPT等を会社で契約している': 'ツール導入済みなら次のステップはエージェント化です。「聞いたら答える」から「業務を前に進める」AIへのアップグレードが効果的です。',
    'AIツールを業務に組み込み済み': '既にAI活用が進んでいます。さらなる最適化として、複数業務の横断連携や承認フロー自動化で、次のレベルの効率化が見込めます。'
  };
  function calcScore() {
    var base = 0;
    if (answers.industry) base += answers.industry.score;
    if (answers.size) base += answers.size.score;
    if (answers.ai_status) base += answers.ai_status.score;
    var painCount = answers.pain_areas ? answers.pain_areas.length : 0;
    base += Math.min(painCount * 3, 15);
    if (answers.freetext && answers.freetext.length > 20) base += 5;
    else if (answers.freetext && answers.freetext.length > 0) base += 2;
    return Math.min(Math.round((base / 50) * 100), 100);
  }
  function getScoreLabel(score) {
    if (score >= 80) return 'AI導入の効果が非常に高い企業です';
    if (score >= 60) return 'AI導入で大きな改善が見込めます';
    if (score >= 40) return 'AI導入のポテンシャルがあります';
    return 'まずは小さく始めることをおすすめします';
  }
  function getPlan(score) {
    for (var i = PLANS.length - 1; i >= 0; i--) {
      if (score >= PLANS[i].min) return PLANS[i];
    }
    return PLANS[0];
  }
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }
  function buildSummary() {
    var parts = [];
    if (answers.industry) parts.push('業種: ' + answers.industry.value);
    if (answers.size) parts.push('従業員: ' + answers.size.value);
    if (answers.ai_status) parts.push('AI活用状況: ' + answers.ai_status.value);
    if (answers.pain_areas && answers.pain_areas.length > 0) {
      parts.push('課題業務: ' + answers.pain_areas.join('、'));
    }
    if (answers.freetext) {
      parts.push('具体的な課題: 「' + escapeHtml(answers.freetext) + '」');
    }
    return parts.join('\n');
  }
  function showResult() {
    var score = calcScore();
    var plan = getPlan(score);
    steps.forEach(function(s) { s.classList.remove('active'); });
    dots.forEach(function(d) { d.classList.add('done'); });
    document.getElementById('diag-progress').style.display = 'none';
    var result = document.getElementById('diag-result');
    result.classList.add('active');
    var circumference = 326.7;
    var offset = circumference - (score / 100) * circumference;
    setTimeout(function() {
      document.getElementById('score-circle').style.strokeDashoffset = offset;
    }, 100);
    var numEl = document.getElementById('score-num');
    var counter = 0;
    var interval = setInterval(function() {
      counter += 2;
      if (counter >= score) { counter = score; clearInterval(interval); }
      numEl.textContent = counter;
    }, 20);
    document.getElementById('score-label').textContent = getScoreLabel(score);
    var summaryParts = [];
    if (answers.industry) summaryParts.push(answers.industry.value + '業界');
    if (answers.size) summaryParts.push('従業員' + answers.size.value);
    summaryParts.push('の企業として診断しました。');
    if (answers.ai_status) {
      summaryParts.push(AI_STATUS_INSIGHTS[answers.ai_status.value] || '');
    }
    if (answers.freetext) {
      summaryParts.push('ご記入いただいた課題に対しても、AIエージェントによる改善が期待できます。');
    }
    document.getElementById('summary-text').textContent = summaryParts.join('');
    var tasksHtml = '';
    var painAreas = answers.pain_areas || [];
    var totalWeeklyHours = 0;
    var sortedTasks = painAreas.slice().sort(function(a, b) {
      return (TASK_DB[b] ? TASK_DB[b].priority : 5) - (TASK_DB[a] ? TASK_DB[a].priority : 5);
    });
    sortedTasks.forEach(function(task) {
      var info = TASK_DB[task];
      if (info) {
        var saved = Math.round(info.hoursPerWeek * info.elimination * 10) / 10;
        totalWeeklyHours += saved;
        tasksHtml += '<div class="diag-result-item"><span>'
          + '<strong>' + task + '</strong>'
          + '<span style="display:inline-block; background:#111; color:#fff; font-size:12px; font-weight:700; padding:2px 8px; margin-left:8px;">週 ' + saved + 'h 削減</span>'
          + '<br><span style="color:#666;">' + info.effect + '</span>'
          + '</span></div>';
      }
    });
    if (!tasksHtml) {
      tasksHtml = '<div class="diag-result-item"><span>業務を選択されなかったため、個別のヒアリングで最適な業務を特定します。</span></div>';
    }
    document.getElementById('result-tasks').innerHTML = tasksHtml;
    if (totalWeeklyHours > 0) {
      var yearlyHours = Math.round(totalWeeklyHours * 50);
      var hourlyCost = 3000;
      var yearlyValue = yearlyHours * hourlyCost;
      var valueStr = yearlyValue >= 10000 ? Math.round(yearlyValue / 10000) + '万' : yearlyValue.toLocaleString();
      var timeBox = document.getElementById('result-time');
      if (timeBox) {
        timeBox.style.display = 'block';
        timeBox.innerHTML = '<div style="display:flex; justify-content:center; gap:48px; flex-wrap:wrap;">'
          + '<div style="text-align:center;"><div style="font-size:40px; font-weight:900;">' + totalWeeklyHours.toFixed(1) + '<span style="font-size:16px; font-weight:400;">h</span></div><div style="font-size:12px; color:#666;">週間削減時間</div></div>'
          + '<div style="text-align:center;"><div style="font-size:40px; font-weight:900;">' + yearlyHours + '<span style="font-size:16px; font-weight:400;">h</span></div><div style="font-size:12px; color:#666;">年間削減時間</div></div>'
          + '<div style="text-align:center;"><div style="font-size:40px; font-weight:900;">約' + valueStr + '<span style="font-size:16px; font-weight:400;">円</span></div><div style="font-size:12px; color:#666;">年間効果額（時給3,000円換算）</div></div>'
          + '</div>'
          + '<p style="text-align:center; font-size:13px; color:#999; margin-top:16px;">この時間を売上を生む業務に再配分できます。</p>';
      }
    }
    document.getElementById('plan-name').textContent = plan.name;
    document.getElementById('plan-title').textContent = plan.title;
    document.getElementById('plan-desc').textContent = plan.desc;
    document.getElementById('plan-price').innerHTML = plan.price + '<span>（税別）</span>';
    var insightsHtml = '';
    if (answers.ai_status && answers.ai_status.value === 'まだ何も使っていない') {
      insightsHtml += '<div class="diag-result-item"><span>AI未導入の企業は、最初の1業務を自動化するだけで、全社的なAI活用への意識が大きく変わります。</span></div>';
    }
    if (painAreas.length >= 3) {
      insightsHtml += '<div class="diag-result-item"><span>複数の業務に課題があるため、段階的な導入よりも業務横断のエージェント基盤を構築する方が費用対効果が高い可能性があります。</span></div>';
    }
    if (answers.size && (answers.size.value === '101〜300名' || answers.size.value === '301〜500名')) {
      insightsHtml += '<div class="diag-result-item"><span>この規模の企業では、部門別の権限設計と承認フローの整備が導入成功のカギになります。</span></div>';
    }
    if (answers.size && answers.size.value === '1〜10名') {
      insightsHtml += '<div class="diag-result-item"><span>少人数の企業ほど、1人あたりのAI効果が大きくなります。経営者自身がAIを使いこなすことで、組織全体の生産性が劇的に変わります。</span></div>';
    }
    insightsHtml += '<div class="diag-result-item"><span>エージェント型AIは「聞いたら答える」ではなく「業務を分解し、進め、承認を経て完了する」AIです。ChatGPTとは本質的に異なります。</span></div>';
    document.getElementById('result-insights').innerHTML = insightsHtml;
    window.scrollTo({ top: result.offsetTop - 100, behavior: 'smooth' });
  }
})();