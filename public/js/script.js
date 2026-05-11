document.addEventListener("DOMContentLoaded", () => {

    const addForm = document.getElementById("add-app-form");
    const jobContainer = document.getElementById("job-list-container");
    const searchInput = document.getElementById("app-search");

    // GET USER NAME FROM BACKEND
    fetch("/user")
        .then(res => res.json())
        .then(data => {
            const userSpan = document.getElementById("user-name");
            if (userSpan && data.fullname) {
                userSpan.textContent = data.fullname;
            }
        });

    // DASHBOARD
    if (jobContainer) {
        loadJobs();

        if (searchInput) {
            searchInput.addEventListener("input", () => {
                loadJobs(searchInput.value, []);
            });
        }

        const filterBtn = document.querySelector(".btn-filter");
        const filterMenu = document.getElementById("filter-menu");
        let selectedFilters = [];

        if (filterBtn && filterMenu) {
            filterBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                filterMenu.style.display =
                    filterMenu.style.display === "flex" ? "none" : "flex";
            });

            const options = document.querySelectorAll(".filter-option");
            options.forEach(option => {
                option.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const value = option.textContent;
                    if (selectedFilters.includes(value)) {
                        selectedFilters = selectedFilters.filter(v => v !== value);
                        option.classList.remove("active");
                    } else {
                        selectedFilters.push(value);
                        option.classList.add("active");
                    }
                    if (searchInput) searchInput.value = "";
                    loadJobs("", selectedFilters);
                });
            });

            document.addEventListener("click", (e) => {
                if (!filterMenu.contains(e.target) && !filterBtn.contains(e.target)) {
                    filterMenu.style.display = "none";
                }
            });
        }

        // Load statistics only on dashboard
        loadStatistics();
    }
});

// =====================
// LOAD JOBS
// =====================
async function loadJobs(searchText = "", filterStatus = []) {
    const jobContainer = document.getElementById("job-list-container");
    jobContainer.innerHTML = `<p class="empty-message">Loading...</p>`;

    try {
        const response = await fetch("/jobs");
        const jobs = await response.json();

        const filteredJobs = jobs.filter(job => {
            const matchesSearch =
                (job.company || "").toLowerCase().includes(searchText.toLowerCase()) ||
                (job.role || "").toLowerCase().includes(searchText.toLowerCase());
            const matchesFilter =
                filterStatus.length === 0 ||
                filterStatus.includes(job.status);
            return matchesSearch && matchesFilter;
        });

        updateStats(jobs);

        jobContainer.innerHTML = "";

        if (filteredJobs.length === 0) {
            jobContainer.innerHTML = `<p class="empty-message">No applications found.</p>`;
            return;
        }

        filteredJobs.forEach(job => {
            const card = document.createElement("div");
            card.className = "job-card";
            card.setAttribute("data-id", job._id);

            card.innerHTML = `
                <div class="card-menu">
                    <button class="menu-btn">⋮</button>
                    <div class="menu-dropdown">
                        <button class="edit-btn">Edit</button>
                        <button class="delete-btn" data-id="${job._id}">Delete</button>
                    </div>
                </div>
                <div class="card-content">
                    <h3>${job.company}</h3>
                    <p><strong>Role:</strong> ${job.role}</p>
                    <p><strong>Status:</strong>
                        <span class="status-tag status-${job.status.toLowerCase()}">${job.status}</span>
                    </p>
                </div>
            `;

            jobContainer.appendChild(card);
        });

    } catch (error) {
        console.log("Error loading jobs:", error);
        jobContainer.innerHTML = `<p class="empty-message">Could not load applications.</p>`;
    }
}

// =====================
// UPDATE STAT CARDS
// =====================
function updateStats(jobs) {
    const totalCount     = document.getElementById("total-count");
    const appliedCount   = document.getElementById("applied-count");
    const interviewCount = document.getElementById("interview-count");
    const offerCount     = document.getElementById("offer-count");

    if (totalCount)     totalCount.textContent     = jobs.length;
    if (appliedCount)   appliedCount.textContent   = jobs.filter(j => j.status === "Applied").length;
    if (interviewCount) interviewCount.textContent = jobs.filter(j => j.status === "Interview").length;
    if (offerCount)     offerCount.textContent     = jobs.filter(j => j.status === "Offer").length;
}

// =====================
// CLICK EVENTS
// =====================
document.addEventListener("click", (e) => {

    // MENU TOGGLE
    if (e.target.classList.contains("menu-btn")) {
        const dropdown = e.target.nextElementSibling;
        dropdown.style.display =
            dropdown.style.display === "block" ? "none" : "block";
    }

    // DELETE
    if (e.target.classList.contains("delete-btn")) {
        const id = e.target.getAttribute("data-id");
        const confirmDelete = confirm("Delete this job?");
        if (!confirmDelete) return;
        fetch(`/jobs/${id}`, { method: "DELETE" })
            .then(() => loadJobs())
            .catch(err => console.log(err));
    }

    // EDIT
    if (e.target.classList.contains("edit-btn")) {
        const id = e.target.closest(".job-card").dataset.id;
        window.location.href = `application.html?id=${id}`;
    }
});

// =====================
// EDIT MODE
// =====================
document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) return;

    try {
        const res = await fetch("/jobs");
        const jobs = await res.json();
        const job = jobs.find(j => j._id === id);
        if (!job) return;

        document.getElementById("compName").value    = job.company;
        document.getElementById("jobRole").value     = job.role;
        document.getElementById("statusSelect").value = job.status;

        const form = document.getElementById("add-app-form");
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            await fetch(`/jobs/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    compName:      document.getElementById("compName").value,
                    jobRole:       document.getElementById("jobRole").value,
                    statusSelect:  document.getElementById("statusSelect").value
                })
            });
            window.location.href = "dashboard.html";
        });

    } catch (err) {
        console.log(err);
    }
});

// =====================
// STATISTICS SECTION
// =====================
async function loadStatistics() {
    try {
        const res = await fetch('/jobs');
        if (!res.ok) return;
        const jobs = await res.json();
        if (jobs.length === 0) return;

        computeFunnel(jobs);
        computeWeeklyChart(jobs);
        computeRoleBarChart(jobs);
        computeRolePieChart(jobs);
        computeInsights(jobs);

    } catch (err) {
        console.log('Stats error:', err);
    }
}

// FUNNEL
function computeFunnel(jobs) {
    const total       = jobs.length;
    const interview   = jobs.filter(j => j.status === 'Interview' || j.status === 'Offer').length;
    const offer       = jobs.filter(j => j.status === 'Offer').length;
    const rejected    = jobs.filter(j => j.status === 'Rejected').length;

    const interviewPct = total > 0 ? Math.round((interview / total) * 100) : 0;
    const offerPct     = total > 0 ? Math.round((offer / total) * 100) : 0;
    const rejectedPct  = total > 0 ? Math.round((rejected / total) * 100) : 0;

    const fac = document.getElementById('funnel-applied-count');
    const fab = document.getElementById('funnel-applied-bar');
    const fil = document.getElementById('funnel-interview-label');
    const fib = document.getElementById('funnel-interview-bar');
    const fol = document.getElementById('funnel-offer-label');
    const fob = document.getElementById('funnel-offer-bar');
    const frl = document.getElementById('funnel-rejected-label');
    const frb = document.getElementById('funnel-rejected-bar');

    if (fac) fac.textContent       = total;
    if (fab) fab.style.width       = '100%';
    if (fil) fil.textContent       = `Interview — ${interviewPct}%`;
    if (fib) fib.style.width       = interviewPct + '%';
    if (fol) fol.textContent       = `Offer — ${offerPct}%`;
    if (fob) fob.style.width       = offerPct + '%';
    if (frl) frl.textContent       = `Rejected — ${rejectedPct}%`;
    if (frb) frb.style.width       = rejectedPct + '%';
}

// WEEKLY CHART
function computeWeeklyChart(jobs) {
    const weeks = {};
    jobs.forEach(job => {
        const date = new Date(job.createdAt);
        if (isNaN(date)) return;
        const week = getWeekLabel(date);
        weeks[week] = (weeks[week] || 0) + 1;
    });

    const labels = Object.keys(weeks).slice(-6);
    const data   = labels.map(w => weeks[w]);
    const ctx    = document.getElementById('weeklyChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                data,
                borderColor: '#1a35a0',
                backgroundColor: 'rgba(26,53,160,0.07)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#1a35a0',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } }, grid: { color: 'rgba(0,0,0,0.05)' } },
                x: { ticks: { font: { size: 11 } }, grid: { display: false } }
            }
        }
    });
}

function getWeekLabel(date) {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    return `${start.getMonth() + 1}/${start.getDate()}`;
}

// INTERVIEW RATE BY ROLE
function computeRoleBarChart(jobs) {
    const roleMap = {};
    jobs.forEach(job => {
        const role = job.role || 'Other';
        if (!roleMap[role]) roleMap[role] = { total: 0, interviewed: 0 };
        roleMap[role].total++;
        if (job.status === 'Interview' || job.status === 'Offer') roleMap[role].interviewed++;
    });

    const roles = Object.keys(roleMap);
    const rates = roles.map(r => Math.round((roleMap[r].interviewed / roleMap[r].total) * 100));
    const ctx   = document.getElementById('roleBarChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: roles,
            datasets: [{
                data: rates,
                backgroundColor: ['#1a35a0','#3b5bdb','#74c0fc','#bfdbfe','#dbeafe'],
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { callback: v => v + '%', font: { size: 11 } },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                x: { ticks: { font: { size: 11 } }, grid: { display: false } }
            }
        }
    });
}

// ROLE BREAKDOWN PIE
function computeRolePieChart(jobs) {
    const roleCount = {};
    jobs.forEach(job => {
        const role = job.role || 'Other';
        roleCount[role] = (roleCount[role] || 0) + 1;
    });

    const labels = Object.keys(roleCount);
    const data   = labels.map(r => roleCount[r]);
    const colors = ['#1a35a0','#3b5bdb','#74c0fc','#bfdbfe','#dbeafe','#e8effe'];
    const ctx    = document.getElementById('rolePieChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 1,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });

    const legendEl = document.getElementById('rolePieLegend');
    if (!legendEl) return;
    legendEl.innerHTML = labels.map((label, i) => {
        const pct = Math.round((data[i] / jobs.length) * 100);
        return `<span style="display:flex;align-items:center;gap:4px;font-size:11px;color:#5570b0;">
            <span style="width:9px;height:9px;border-radius:2px;background:${colors[i]};flex-shrink:0;"></span>
            ${label} ${pct}%
        </span>`;
    }).join('');
}

// INSIGHTS
function computeInsights(jobs) {
    const container = document.getElementById('insights-container');
    if (!container) return;

    const insights = [];
    const total = jobs.length;

    const roleMap = {};
    jobs.forEach(job => {
        const role = job.role || 'Other';
        if (!roleMap[role]) roleMap[role] = { total: 0, interviewed: 0 };
        roleMap[role].total++;
        if (job.status === 'Interview' || job.status === 'Offer') roleMap[role].interviewed++;
    });

    const bestRole = Object.entries(roleMap)
        .sort((a, b) => (b[1].interviewed / b[1].total) - (a[1].interviewed / a[1].total))[0];

    if (bestRole) {
        const rate = Math.round((bestRole[1].interviewed / bestRole[1].total) * 100);
        insights.push({
            color: '#1a35a0',
            title: `${bestRole[0]} is your strongest role`,
            body: `${rate}% of your ${bestRole[0]} applications lead to an interview. Focus on applying to more of these roles.`
        });
    }

    const interviews    = jobs.filter(j => j.status === 'Interview' || j.status === 'Offer').length;
    const offers        = jobs.filter(j => j.status === 'Offer').length;
    const interviewRate = total > 0 ? Math.round((interviews / total) * 100) : 0;
    const offerRate     = total > 0 ? Math.round((offers / total) * 100) : 0;

    if (interviewRate > 40 && offerRate < 30) {
        insights.push({
            color: '#d97706',
            title: 'Interview-to-offer gap detected',
            body: `You are getting interviews well (${interviewRate}%) but only ${offerRate}% become offers. Practice technical and behavioural questions before your next interview.`
        });
    }

    const rejections    = jobs.filter(j => j.status === 'Rejected').length;
    const rejectionRate = total > 0 ? Math.round((rejections / total) * 100) : 0;

    if (rejectionRate > 30) {
        insights.push({
            color: '#dc2626',
            title: `${rejectionRate}% rejection rate detected`,
            body: `More than a third of your applications are being rejected. Consider tailoring your resume more specifically to each job posting.`
        });
    }

    const recentJobs = jobs.filter(j => {
        const date = new Date(j.createdAt);
        if (isNaN(date)) return false;
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return date >= weekAgo;
    });

    if (recentJobs.length === 0 && total > 0) {
        insights.push({
            color: '#8899cc',
            title: 'No applications this week',
            body: 'You have not added any applications in the last 7 days. Consistency is key — try to apply to at least 3 jobs per week.'
        });
    }

    if (insights.length === 0) {
        insights.push({
            color: '#16a34a',
            title: 'Keep going!',
            body: 'Add more applications to start seeing personalised insights about your job search patterns.'
        });
    }

    container.innerHTML = insights.map(ins => `
        <div style="border-left:3px solid ${ins.color};padding:9px 13px;background:#f7f9ff;margin-bottom:8px;border-radius:0;">
            <div style="font-size:12px;font-weight:600;color:${ins.color};margin-bottom:3px;">${ins.title}</div>
            <div style="font-size:11px;color:#5570b0;line-height:1.5;">${ins.body}</div>
        </div>
    `).join('');
}