// ---------- Helpers ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));


// ---------- Footer year ----------
$("#year").textContent = new Date().getFullYear();

// ---------- Reveal on scroll ----------
const revealEls = $$("[data-reveal]");
const revealObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((e) => {
            if (e.isIntersecting) {
                const delay = e.target.getAttribute("data-reveal-delay");
                if (delay) e.target.style.transitionDelay = `${delay}ms`;
                e.target.classList.add("is-in");
                revealObserver.unobserve(e.target);
            }
        });
    },
    { threshold: 0.14 }
);
revealEls.forEach((el) => revealObserver.observe(el));

// ---------- Story steps (scroll-driven highlight + sticky card updates) ----------
const steps = $$(".step");
const storyTitle = $("#storyTitle");
const storyBody = $("#storyBody");
const storyProgress = $("#storyProgress");
const storyStatus = $("#storyStatus");

const storyData = {
    1: {
        title: "Planning got blocked.",
        body: "Migration estimates became unreliable due to missing/unclear mini components needed for headless implementations.",
    },
    2: {
        title: "Dependency risk detected.",
        body: "I identified that the number of missing mini components would compound delays and risk in our headless migration plan.",
    },
    3: {
        title: "Options & trade-offs proposed.",
        body: "Option 1: build missing mini components to keep design token integration. Option 2: go without (faster now, weaker DS alignment).",
    },
    4: {
        title: "Decision secured.",
        body: "In the technical decision meeting, I aligned stakeholders and drove the technical narrative to secure buy-in for ownership.",
    },
    5: {
        title: "Team retained + migration unblocked.",
        body: "During downsizing pressure, this decision improved delivery confidence and kept the team intact while unblocking execution.",
    },
};

const stepObserver = new IntersectionObserver(
    (entries) => {
        // pick the most visible step
        const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;

        const n = Number(visible.target.getAttribute("data-step"));
        const hudLabel = document.getElementById("hudLabel");
        const hudBar = document.getElementById("hudBar");

        steps.forEach((s) => s.classList.toggle("is-active", Number(s.dataset.step) === n));

        if (storyTitle && storyBody && storyProgress && storyStatus && storyData[n]) {
            storyTitle.textContent = storyData[n].title;
            storyBody.textContent = storyData[n].body;
            storyProgress.style.width = `${(n / 5) * 100}%`;
            storyStatus.textContent = `Step ${n} of 5`;

            if (hudLabel && hudBar) {
                hudLabel.textContent = `Step ${n} / 5`;
                hudBar.style.width = `${(n / 5) * 100}%`;
            }
        }
    },
    { threshold: [0.35, 0.5, 0.65] }
);

steps.forEach((s) => stepObserver.observe(s));

// ---------- Carousel: buttons + drag-to-scroll ----------
const track = $(".track");
const prevBtn = $(".car-btn.prev");
const nextBtn = $(".car-btn.next");

function scrollByCard(dir = 1) {
    if (!track) return;
    const card = $(".cardx", track);
    const step = (card?.getBoundingClientRect().width || 320) + 14;
    track.scrollBy({ left: dir * step, behavior: "smooth" });
}

prevBtn?.addEventListener("click", () => scrollByCard(-1));
nextBtn?.addEventListener("click", () => scrollByCard(1));

// Drag support (mouse)
let isDown = false;
let startX = 0;
let startScroll = 0;

track?.addEventListener("mousedown", (e) => {
    isDown = true;
    startX = e.pageX;
    startScroll = track.scrollLeft;
    track.classList.add("is-dragging");
});

window.addEventListener("mouseup", () => {
    isDown = false;
    track?.classList.remove("is-dragging");
});

window.addEventListener("mousemove", (e) => {
    if (!isDown || !track) return;
    const dx = e.pageX - startX;
    track.scrollLeft = startScroll - dx;
});

// ---------- Filter pills (dim non-matching cards) ----------
const pills = $$(".pill");
const cards = $$(".cardx");

pills.forEach((p) =>
    p.addEventListener("click", () => {
        pills.forEach((x) => x.classList.remove("is-active"));
        p.classList.add("is-active");

        const filter = p.getAttribute("data-filter");
        cards.forEach((c) => {
            if (filter === "all") {
                c.classList.remove("is-dim");
                return;
            }
            const tags = (c.getAttribute("data-tags") || "").split(/\s+/);
            c.classList.toggle("is-dim", !tags.includes(filter));
        });
    })
);

// ---------- Accordion: keep only one open ----------
const details = $$(".accordion details");
details.forEach((d) =>
    d.addEventListener("toggle", () => {
        if (!d.open) return;
        details.forEach((other) => {
            if (other !== d) other.open = false;
        });
    })
);

// ---------- Tabbar active state ----------
const tabs = Array.from(document.querySelectorAll(".tabbar .tab"));
const sections = ["case", "impact", "senior", "contact"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

const tabObserver = new IntersectionObserver(
    (entries) => {
        const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;

        const id = visible.target.id;
        tabs.forEach((t) => t.classList.toggle("is-active", t.getAttribute("href") === `#${id}`));
    },
    { threshold: [0.35, 0.5, 0.65] }
);

sections.forEach((s) => tabObserver.observe(s));


// ---------- Executive timeline active step highlight (CENTER BAND) ----------
const timelineItems = Array.from(document.querySelectorAll(".timeline__list .t"));
const scroller = document.getElementById("timelineScroller"); // if you use the scroller wrapper

function setActiveTimelineItem(el) {
    timelineItems.forEach((x) => x.classList.toggle("is-active", x === el));
}

function centerBandObserver(rootEl) {
    const obs = new IntersectionObserver(
        (entries) => {
            // Only consider entries that intersect the CENTER band (because of rootMargin)
            const candidates = entries.filter((e) => e.isIntersecting).map((e) => e.target);
            if (!candidates.length) return;

            // Choose the candidate closest to the CENTER line
            const centerY = rootEl
                ? rootEl.getBoundingClientRect().top + rootEl.getBoundingClientRect().height / 2
                : window.innerHeight / 2;

            let best = null;
            let bestDist = Infinity;

            for (const el of candidates) {
                const r = el.getBoundingClientRect();
                const elCenter = r.top + r.height / 2;
                const dist = Math.abs(elCenter - centerY);
                if (dist < bestDist) {
                    bestDist = dist;
                    best = el;
                }
            }

            if (best) setActiveTimelineItem(best);
        },
        {
            root: rootEl || null,
            threshold: 0,
            // This is the magic: only the middle band counts as "intersecting"
            // e.g. top 45% and bottom 45% are ignored => middle 10% band
            rootMargin: "-30% 0px -60% 0px",
        }
    );

    timelineItems.forEach((item) => obs.observe(item));
    if (timelineItems[0]) setActiveTimelineItem(timelineItems[0]);
}

// Use scroller as root if it exists, else viewport
if (timelineItems.length) {
    centerBandObserver(scroller || null);
}
