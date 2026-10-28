
(function () {
  "use strict";

  const STORAGE_KEY = "hostelVisitors";

  function readVisitors() {
    try {
      const data = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function saveVisitors(visitors) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visitors));
  }

  function makeElement(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function renderVisitors(list) {
    list.replaceChildren();

    const visitors = readVisitors();

    if (!visitors.length) {
      list.appendChild(
        makeElement("p", "visitor-empty", "No visitors registered yet.")
      );
      return;
    }

    visitors.forEach((visitor, index) => {
      const card = makeElement("article", "visitor-record");

      card.appendChild(makeElement("h4", "", visitor.name));
      card.appendChild(makeElement("p", "", "Contact: " + visitor.phone));
      card.appendChild(makeElement("p", "", "Student: " + visitor.student));
      card.appendChild(makeElement("p", "", "Room: " + visitor.room));
      card.appendChild(makeElement("p", "", "Purpose: " + visitor.purpose));
      card.appendChild(
        makeElement("p", "", "Visit: " + visitor.date + " at " + visitor.time)
      );

      card.appendChild(
        makeElement(
          "span",
          "visitor-status",
          visitor.checkedOut ? "Checked Out" : "Checked In"
        )
      );

      if (!visitor.checkedOut) {
        const button = makeElement(
          "button",
          "visitor-checkout",
          "Check Out"
        );
        button.type = "button";

        button.addEventListener("click", () => {
          const latest = readVisitors();
          if (!latest[index]) return;

          latest[index].checkedOut = true;
          saveVisitors(latest);
          renderVisitors(list);
        });

        card.appendChild(button);
      }

      list.appendChild(card);
    });
  }

  function initVisitorManagement({ content }) {
    if (!content) return;

    // Render inside the main dashboard, NOT the sidebar.
    content.innerHTML = `
      <section class="visitor-page">
        <header class="visitor-page__header">
          <h2>Visitor Management</h2>
          <p>Register hostel visitors and track their check-in status.</p>
        </header>

        <div class="visitor-card">
          <form id="adminVisitorForm" class="visitor-form">
            <div class="visitor-field">
              <label for="adminVisitorName">Visitor Name</label>
              <input id="adminVisitorName" required>
            </div>

            <div class="visitor-field">
              <label for="adminVisitorPhone">Contact Number</label>
              <input id="adminVisitorPhone" type="tel" required>
            </div>

            <div class="visitor-field">
              <label for="adminVisitStudent">Student to Visit</label>
              <input id="adminVisitStudent" required>
            </div>

            <div class="visitor-field">
              <label for="adminVisitorRoom">Room Number</label>
              <input id="adminVisitorRoom" required>
            </div>

            <div class="visitor-field visitor-field--full">
              <label for="adminVisitPurpose">Purpose of Visit</label>
              <textarea id="adminVisitPurpose" required></textarea>
            </div>

            <div class="visitor-field">
              <label for="adminVisitDate">Visit Date</label>
              <input id="adminVisitDate" type="date" required>
            </div>

            <div class="visitor-field">
              <label for="adminVisitTime">Entry Time</label>
              <input id="adminVisitTime" type="time" required>
            </div>

            <button class="visitor-submit" type="submit">
              Register Visitor
            </button>
          </form>

          <div class="visitor-list">
            <h3>Registered Visitors</h3>
            <div id="adminVisitorResults"></div>
          </div>
        </div>
      </section>
    `;

    const form = content.querySelector("#adminVisitorForm");
    const results = content.querySelector("#adminVisitorResults");

    renderVisitors(results);

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const visitor = {
        name: content.querySelector("#adminVisitorName").value.trim(),
        phone: content.querySelector("#adminVisitorPhone").value.trim(),
        student: content.querySelector("#adminVisitStudent").value.trim(),
        room: content.querySelector("#adminVisitorRoom").value.trim(),
        purpose: content.querySelector("#adminVisitPurpose").value.trim(),
        date: content.querySelector("#adminVisitDate").value,
        time: content.querySelector("#adminVisitTime").value,
        checkedOut: false
      };

      const visitors = readVisitors();
      visitors.push(visitor);
      saveVisitors(visitors);

      form.reset();
      renderVisitors(results);
    });
  }

  window.adminVisitorInit = initVisitorManagement;
})();
