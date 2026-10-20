(() => {
  const form = document.querySelector("#intake-form");
  const steps = Array.from(document.querySelectorAll(".wizard-step"));
  const transcript = document.querySelector("#transcript");
  const result = document.querySelector("#summary-result");
  const summaryText = document.querySelector("#summary-text");
  const copyStatus = document.querySelector("#copy-status");
  const routeFill = document.querySelector("[data-route-fill]");
  const routeStations = Array.from(document.querySelectorAll("[data-route-station]"));
  const fields = Array.from(form.querySelectorAll("input, textarea, select"));
  const labels = {
    topic: "需求主题",
    pain: "当前流程与痛点",
    outcome: "期望结果",
    systems: "现有系统或数据",
    budget: "预算范围",
    timing: "期望时间",
    name: "称呼",
    contact: "联系方式",
  };
  let currentStep = 0;

  function fieldError(field) {
    if (field.required && !field.value.trim()) {
      return "请填写这一项，再继续。";
    }
    if (field.value.trim() && field.minLength > 0 && field.value.trim().length < field.minLength) {
      return field.name === "pain"
        ? "请再补充一些当前流程或卡点，让问题更容易理解。"
        : "请再补充一些内容，方便理解你的期望。";
    }
    return "";
  }

  function updateFieldState(field, showError) {
    const error = fieldError(field);
    const errorNode = document.querySelector(`#${field.id}-error`);
    if (showError && error) {
      field.setAttribute("aria-invalid", "true");
      if (errorNode) {
        errorNode.textContent = error;
        errorNode.hidden = false;
      }
      return false;
    }

    field.removeAttribute("aria-invalid");
    if (errorNode) {
      errorNode.textContent = "";
      errorNode.hidden = true;
    }
    return true;
  }

  function validateStep(stepIndex) {
    const stepFields = Array.from(steps[stepIndex].querySelectorAll("input, textarea, select"));
    let firstInvalid = null;
    let valid = true;

    stepFields.forEach((field) => {
      if (!updateFieldState(field, true)) {
        valid = false;
        firstInvalid ||= field;
      }
    });

    if (firstInvalid) {
      firstInvalid.focus();
    }
    return valid;
  }

  function stepSummary(stepIndex) {
    const names = [
      ["topic", "pain"],
      ["outcome", "systems"],
      ["budget", "timing"],
      ["name", "contact"],
    ][stepIndex];
    return names
      .map((name) => {
        const field = form.elements.namedItem(name);
        if (!field || typeof field.value !== "string") return "";
        const value = field.value.trim();
        return value ? `${labels[name]}：${value}` : "";
      })
      .filter(Boolean)
      .join(" · ");
  }

  function renderTranscript() {
    transcript.replaceChildren();
    for (let index = 0; index < currentStep; index += 1) {
      const row = document.createElement("div");
      row.className = "transcript-row";
      const value = document.createElement("span");
      value.className = "transcript-value";
      value.textContent = stepSummary(index);
      value.title = stepSummary(index);
      const label = document.createElement("span");
      label.className = "transcript-label";
      label.textContent = ["问题", "目标", "条件", "联系"][index];
      const edit = document.createElement("button");
      edit.className = "transcript-edit";
      edit.type = "button";
      edit.dataset.goStep = String(index);
      edit.textContent = "修改";
      edit.setAttribute("aria-label", `${label.textContent}：返回修改`);
      row.append(label, value, edit);
      transcript.append(row);
    }
    transcript.hidden = currentStep === 0;
  }

  function updateRoute() {
    routeFill.style.transform = `scaleX(${currentStep / (steps.length - 1)})`;
    routeStations.forEach((station, index) => {
      station.classList.toggle("is-current", index === currentStep);
      station.classList.toggle("is-complete", index < currentStep);
      if (index === currentStep) {
        station.setAttribute("aria-current", "step");
      } else {
        station.removeAttribute("aria-current");
      }
    });
  }

  function showStep(nextStep, shouldFocus = true) {
    currentStep = nextStep;
    steps.forEach((step, index) => {
      step.hidden = index !== currentStep;
    });
    result.hidden = true;
    form.hidden = false;
    renderTranscript();
    updateRoute();
    copyStatus.textContent = "";
    if (shouldFocus) {
      steps[currentStep].querySelector("h2").focus();
    }
  }

  window.addEventListener("pageshow", () => {
    form.reset();
    summaryText.value = "";
    showStep(0, false);
  });

  document.querySelectorAll('a[href="#intake-title"]').forEach((link) => {
    link.addEventListener("click", () => {
      if (currentStep !== 0 || form.hidden) {
        showStep(0, false);
      }
    });
  });

  function createSummary() {
    const values = new FormData(form);
    // FormData 取不到的键返回 null，统一兜底为空串再 trim
    const read = (name) => String(values.get(name) ?? "").trim();
    const lines = [
      "赫匝 · 需求梳理摘要（本地生成，未发送）",
      "",
      `需求主题：${read("topic")}`,
      `当前流程与痛点：${read("pain")}`,
      `期望结果：${read("outcome")}`,
      `现有系统或数据：${read("systems") || "未填写"}`,
      `预算范围：${read("budget") || "未填写"}`,
      `期望时间：${read("timing") || "未填写"}`,
      `称呼：${read("name") || "未提供"}`,
      `联系方式：${read("contact") || "未提供"}`,
      "",
      "注意：本摘要只在当前浏览器页面中生成，没有上传或保存。请自行确认内容后再决定是否保留。",
    ];
    return lines.join("\n");
  }

  form.addEventListener("input", (event) => {
    if (event.target.matches("input, textarea, select")) {
      updateFieldState(event.target, false);
    }
  });

  form.addEventListener("change", (event) => {
    if (event.target.matches("input, textarea, select")) {
      updateFieldState(event.target, false);
    }
  });

  form.addEventListener("click", (event) => {
    const nextButton = event.target.closest("[data-next]");
    const backButton = event.target.closest("[data-back]");
    if (nextButton && validateStep(currentStep)) {
      showStep(Math.min(currentStep + 1, steps.length - 1));
    }
    if (backButton) {
      showStep(Math.max(currentStep - 1, 0));
    }
  });

  transcript.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-go-step]");
    if (editButton) {
      showStep(Number(editButton.dataset.goStep));
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const submitButton = event.submitter || form.querySelector('[type="submit"]');
    // 防重复提交：接真实后端前，这里就是避免重复写入的关键位置
    if (submitButton && submitButton.disabled) return;
    if (!validateStep(currentStep)) {
      return;
    }
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "正在生成…";
    }
    // Replace this local-only path with a verified receiver after privacy and consent are configured.
    try {
      summaryText.value = createSummary();
      form.hidden = true;
      transcript.hidden = true;
      result.hidden = false;
      copyStatus.textContent = "";
      updateRoute();
      result.querySelector("h2").focus();
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "生成本地摘要";
      }
    }
  });

  document.querySelector("#edit-summary").addEventListener("click", () => {
    showStep(steps.length - 1);
  });

  document.querySelector("#copy-summary").addEventListener("click", async () => {
    try {
      if (!navigator.clipboard || !window.isSecureContext) {
        throw new Error("Clipboard access is unavailable in this context.");
      }
      await navigator.clipboard.writeText(summaryText.value);
      copyStatus.textContent = "摘要已复制到剪贴板。它仍未发送或保存。";
    } catch (error) {
      summaryText.focus();
      summaryText.select();
      copyStatus.textContent = "浏览器未允许自动复制。摘要已选中，请使用 Ctrl+C（Mac 使用 Command+C）手动复制。";
    }
  });
})();
