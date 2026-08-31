(() => {
  const ctaButtons = document.querySelectorAll('.js-cta');

  const trackEvent = (event, detail = {}) => {
    console.log({ event, ...detail });
  };

  ctaButtons.forEach((button) => {
    button.addEventListener('click', () => {
      trackEvent('affiliate_cta_click', { location: button.dataset.ctaLocation });
    });
  });

  document.querySelectorAll('.faq-list details').forEach((details) => {
    const summary = details.querySelector('summary');
    summary?.setAttribute('aria-expanded', String(details.open));
    details.addEventListener('toggle', () => {
      summary?.setAttribute('aria-expanded', String(details.open));
    });
  });

  const diagnosis = document.querySelector('#diagnosis');
  if (!diagnosis) return;

  const intro = diagnosis.querySelector('[data-diagnosis-intro]');
  const quiz = diagnosis.querySelector('[data-diagnosis-quiz]');
  const loading = diagnosis.querySelector('[data-diagnosis-loading]');
  const result = diagnosis.querySelector('[data-diagnosis-result]');
  const startButton = diagnosis.querySelector('[data-diagnosis-start]');
  const retryButton = diagnosis.querySelector('[data-diagnosis-retry]');
  const answerButtons = diagnosis.querySelectorAll('[data-answer]');
  const questions = [...diagnosis.querySelectorAll('[data-question]')];
  const currentQuestion = diagnosis.querySelector('[data-current-question]');
  const progressbar = diagnosis.querySelector('[data-progressbar]');
  const progressFill = diagnosis.querySelector('[data-progress-fill]');
  const progressSymbols = [...diagnosis.querySelectorAll('[data-progress-symbols] i')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const resultData = {
    wait: {
      icon: '☾',
      code: 'LOVE TYPE · MOON-W',
      prefix: '彼の言葉を信じて',
      title: '待ちすぎタイプ',
      description: '彼を疑いたくないからこそ、「もう少し」という言葉を信じて、自分の時間を後回しにしているのかもしれません。',
      traits: ['一途', '相手優先', '信じる力'],
      topics: ['彼が今抱えている本音', '二人の関係が動かない理由', '待ち続ける前に確認したいこと']
    },
    silence: {
      icon: '♡',
      code: 'LOVE TYPE · VEIL-S',
      prefix: '本音を飲み込んでしまう',
      title: '秘密の恋タイプ',
      description: '関係を壊したくない気持ちが強く、寂しさや不安を言えないまま、一人で抱え込んでいるようです。',
      traits: ['繊細', '空気を読む', '本音は慎重'],
      topics: ['誰にも言えない複雑な恋愛', '相手との距離感', '自分が本当に望んでいる関係']
    },
    bond: {
      icon: '✦',
      code: 'LOVE TYPE · CHAIN-B',
      prefix: '離れたいと思っても',
      title: '離れられないタイプ',
      description: '苦しいと分かっていても、彼から連絡が来ると期待してしまう。気持ちと判断が別々になっているのかもしれません。',
      traits: ['情が深い', '思い出重視', 'つながりを守る'],
      topics: ['待つか、離れるか', '関係を続けてしまう理由', '自分が幸せになれる選択肢']
    },
    future: {
      icon: '◇',
      code: 'LOVE TYPE · COMPASS-F',
      prefix: '答えを探し続けている',
      title: '未来コンパスタイプ',
      description: '気持ちだけでなく、この先の時間や幸せも大切にしたい人。自分が望む未来を具体的にすると、進む方向が見えてきそうです。',
      traits: ['未来志向', '慎重', '納得して選ぶ'],
      topics: ['二人の関係が向かう先', '今決めることと待てること', '後悔しないための選択軸']
    },
    complex: {
      icon: '✧',
      code: 'LOVE TYPE · MIX-C',
      prefix: 'いくつもの気持ちが重なる',
      title: '恋の迷いタイプ',
      description: '彼の本音、二人の未来、自分の幸せ。一つだけではなく、いくつもの迷いが重なっているようです。',
      traits: ['多面的', '共感力', 'じっくり考える'],
      topics: ['彼の本音と二人の未来', '誰にも言えない複雑な関係', 'これから大切にしたい自分の気持ち']
    },
    steady: {
      icon: '☼',
      code: 'LOVE TYPE · BALANCE-A',
      prefix: '自分の気持ちを守れている',
      title: 'バランスタイプ',
      description: '今は彼だけに振り回されず、自分の気持ちも見つめられているようです。それでも心に残ることがあるなら、言葉にして整理してみてもよいかもしれません。',
      traits: ['自分軸', '冷静', 'しなやか'],
      topics: ['今の関係で大切にしたいこと', '彼に伝えたい本音', 'これからの自分の選択肢']
    }
  };

  const axisMeta = {
    wait: { label: '相手優先', max: 9 },
    silence: { label: '本音を隠す', max: 9 },
    bond: { label: 'つながり重視', max: 6 },
    future: { label: '未来を考える', max: 6 }
  };

  let index = 0;
  let scores = { wait: 0, silence: 0, bond: 0, future: 0 };
  let totalScore = 0;
  let answering = false;

  const setPanel = (activePanel) => {
    [intro, quiz, loading, result].forEach((panel) => {
      panel.hidden = panel !== activePanel;
    });
  };

  const updateProgress = () => {
    const visibleNumber = index + 1;
    currentQuestion.textContent = String(visibleNumber);
    progressbar.setAttribute('aria-valuenow', String(visibleNumber));
    progressFill.style.width = `${(visibleNumber / questions.length) * 100}%`;
    progressSymbols.forEach((symbol, symbolIndex) => {
      symbol.classList.toggle('is-complete', symbolIndex < index);
    });
  };

  const showQuestion = () => {
    questions.forEach((question, questionIndex) => {
      const isCurrent = questionIndex === index;
      question.hidden = !isCurrent;
      question.classList.toggle('is-active', isCurrent);
      question.classList.remove('is-answered');
      delete question.dataset.choice;
    });
    answerButtons.forEach((button) => {
      button.disabled = false;
      button.setAttribute('aria-pressed', 'false');
    });
    answering = false;
    updateProgress();
  };

  const chooseResultType = () => {
    if (totalScore <= 5) return 'steady';
    const ranked = Object.keys(axisMeta)
      .map((type) => ({ type, value: scores[type] / axisMeta[type].max }))
      .sort((a, b) => b.value - a.value);
    return ranked[0].value - ranked[1].value < 0.12 ? 'complex' : ranked[0].type;
  };

  const renderResult = (type) => {
    const content = resultData[type];
    result.querySelector('[data-result-icon]').textContent = content.icon;
    result.querySelector('[data-result-code]').textContent = content.code;
    result.querySelector('[data-result-prefix]').textContent = content.prefix;
    result.querySelector('[data-result-title]').textContent = content.title;
    result.querySelector('[data-result-description]').textContent = content.description;
    result.querySelector('[data-result-traits]').innerHTML = content.traits
      .map((trait) => `<span>${trait}</span>`)
      .join('');
    result.querySelector('[data-profile-bars]').innerHTML = Object.entries(axisMeta)
      .map(([axis, meta]) => {
        const percentage = Math.round((scores[axis] / meta.max) * 100);
        return `<div class="diagnosis-axis"><span>${meta.label}</span><i><b style="width:${percentage}%"></b></i><em>${percentage}%</em></div>`;
      })
      .join('');
    result.querySelector('[data-result-topics]').innerHTML = content.topics
      .map((topic) => `<li>${topic}</li>`)
      .join('');
    result.dataset.resultType = type;
  };

  const finishDiagnosis = () => {
    progressSymbols.forEach((symbol) => symbol.classList.add('is-complete'));
    setPanel(loading);
    const resultType = chooseResultType();
    const revealDelay = reduceMotion ? 0 : 1150;

    window.setTimeout(() => {
      renderResult(resultType);
      setPanel(result);
      result.focus({ preventScroll: true });
      trackEvent('diagnosis_complete', {
        result: resultType,
        total_score: totalScore,
        scores: { ...scores }
      });
    }, revealDelay);
  };

  const resetDiagnosis = () => {
    index = 0;
    scores = { wait: 0, silence: 0, bond: 0, future: 0 };
    totalScore = 0;
    answering = false;
    progressSymbols.forEach((symbol) => symbol.classList.remove('is-complete'));
    showQuestion();
    setPanel(quiz);
  };

  startButton.addEventListener('click', () => {
    resetDiagnosis();
    trackEvent('diagnosis_start');
  });

  retryButton.addEventListener('click', () => {
    resetDiagnosis();
    quiz.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    trackEvent('diagnosis_retry');
  });

  answerButtons.forEach((button) => {
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => {
      if (answering) return;
      answering = true;

      const answer = button.dataset.answer;
      const score = Number(button.dataset.score);
      const question = questions[index];
      question.classList.add('is-answered');
      question.dataset.choice = String(score);
      button.setAttribute('aria-pressed', 'true');
      answerButtons.forEach((answerButton) => {
        answerButton.disabled = true;
      });

      const type = question.dataset.type;
      scores[type] += score;
      totalScore += score;

      trackEvent('diagnosis_answer', {
        question: index + 1,
        answer,
        score
      });

      const moveDelay = reduceMotion ? 0 : 260;
      window.setTimeout(() => {
        index += 1;
        if (index >= questions.length) {
          finishDiagnosis();
          return;
        }
        showQuestion();
      }, moveDelay);
    });
  });
})();
