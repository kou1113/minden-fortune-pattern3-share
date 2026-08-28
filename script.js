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
      prefix: '彼の言葉を信じて',
      title: '待ちすぎタイプ',
      description: '彼を疑いたくないからこそ、「もう少し」という言葉を信じて、自分の時間を後回しにしているのかもしれません。',
      topics: ['彼が今抱えている本音', '二人の関係が動かない理由', '待ち続ける前に確認したいこと']
    },
    silence: {
      icon: '♡',
      prefix: '本音を飲み込んでしまう',
      title: '秘密の恋タイプ',
      description: '関係を壊したくない気持ちが強く、寂しさや不安を言えないまま、一人で抱え込んでいるようです。',
      topics: ['誰にも言えない複雑な恋愛', '相手との距離感', '自分が本当に望んでいる関係']
    },
    bond: {
      icon: '✦',
      prefix: '離れたいと思っても',
      title: '離れられないタイプ',
      description: '苦しいと分かっていても、彼から連絡が来ると期待してしまう。気持ちと判断が別々になっているのかもしれません。',
      topics: ['待つか、離れるか', '関係を続けてしまう理由', '自分が幸せになれる選択肢']
    },
    complex: {
      icon: '✧',
      prefix: 'いくつもの気持ちが重なる',
      title: '恋の迷いタイプ',
      description: '彼の本音、二人の未来、自分の幸せ。一つだけではなく、いくつもの迷いが重なっているようです。',
      topics: ['彼の本音と二人の未来', '誰にも言えない複雑な関係', 'これから大切にしたい自分の気持ち']
    },
    steady: {
      icon: '☼',
      prefix: '自分の気持ちを守れている',
      title: '見つめ直しタイプ',
      description: '今は彼だけに振り回されず、自分の気持ちも見つめられているようです。それでも心に残ることがあるなら、言葉にして整理してみてもよいかもしれません。',
      topics: ['今の関係で大切にしたいこと', '彼に伝えたい本音', 'これからの自分の選択肢']
    }
  };

  let index = 0;
  let scores = { wait: 0, silence: 0, bond: 0 };
  let yesCount = 0;
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
    if (yesCount === 0) return 'steady';
    const highestScore = Math.max(...Object.values(scores));
    const leaders = Object.keys(scores).filter((type) => scores[type] === highestScore);
    return leaders.length === 1 ? leaders[0] : 'complex';
  };

  const renderResult = (type) => {
    const content = resultData[type];
    result.querySelector('[data-result-icon]').textContent = content.icon;
    result.querySelector('[data-result-prefix]').textContent = content.prefix;
    result.querySelector('[data-result-title]').textContent = content.title;
    result.querySelector('[data-result-description]').textContent = content.description;
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
        checked_answers: yesCount
      });
    }, revealDelay);
  };

  const resetDiagnosis = () => {
    index = 0;
    scores = { wait: 0, silence: 0, bond: 0 };
    yesCount = 0;
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
      const question = questions[index];
      question.classList.add('is-answered');
      question.dataset.choice = answer;
      button.setAttribute('aria-pressed', 'true');
      answerButtons.forEach((answerButton) => {
        answerButton.disabled = true;
      });

      if (answer === 'yes') {
        const type = question.dataset.type;
        scores[type] += 1;
        yesCount += 1;
      }

      trackEvent('diagnosis_answer', {
        question: index + 1,
        answer
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
