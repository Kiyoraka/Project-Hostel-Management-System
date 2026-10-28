
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("visitorForm");
  const results = document.getElementById("visitorResults");

  if (!form || !results) return;

  function displayVisitors() {
    const visitors = JSON.parse(
      localStorage.getItem("hostelVisitors") || "[]"
    );

    results.replaceChildren();

    visitors.forEach((visitor, index) => {
      const item = document.createElement("div");
      item.className = "service-item";

      const details = document.createElement("p");
      details.textContent =
        `Visitor: ${visitor.name} | ` +
        `Contact: ${visitor.phone} | ` +
        `Student: ${visitor.student} | ` +
        `Room: ${visitor.room} | ` +
        `Date: ${visitor.date} | ` +
        `Time: ${visitor.time} | ` +
        `Status: ${visitor.checkedOut ? "Checked Out" : "Checked In"}`;

      const purpose = document.createElement("p");
      purpose.textContent = `Purpose: ${visitor.purpose}`;

      item.append(details, purpose);

      if (!visitor.checkedOut) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = "Check Out";
        button.className = "btn btn-primary";

        button.addEventListener("click", () => {
          const latestVisitors = JSON.parse(
            localStorage.getItem("hostelVisitors") || "[]"
          );

          if (!latestVisitors[index]) return;

          latestVisitors[index].checkedOut = true;

          localStorage.setItem(
            "hostelVisitors",
            JSON.stringify(latestVisitors)
          );

          displayVisitors();
        });

        item.appendChild(button);
      }

      results.appendChild(item);
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const visitor = {
      name: document.getElementById("visitorName").value.trim(),
      phone: document.getElementById("visitorPhone").value.trim(),
      student: document.getElementById("visitStudent").value.trim(),
      room: document.getElementById("visitorRoom").value.trim(),
      purpose: document.getElementById("visitPurpose").value.trim(),
      date: document.getElementById("visitDate").value,
      time: document.getElementById("visitTime").value,
      checkedOut: false
    };

    const visitors = JSON.parse(
      localStorage.getItem("hostelVisitors") || "[]"
    );

    visitors.push(visitor);

    localStorage.setItem(
      "hostelVisitors",
      JSON.stringify(visitors)
    );

    form.reset();
    displayVisitors();

    alert("Visitor registered successfully!");
  });

  displayVisitors();
});
