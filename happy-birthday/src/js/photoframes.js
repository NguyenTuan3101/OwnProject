document.addEventListener('DOMContentLoaded', function () {
    var frames = document.querySelectorAll('.photo-frame');
    var cycleInterval = 4500;

    // Auto-cycle: each frame flips at staggered intervals
    frames.forEach(function (frame, i) {
        setTimeout(function () {
            setInterval(function () {
                frame.classList.toggle('show-back');
            }, cycleInterval);
        }, i * 900);
    });

    // Parallax on mouse move (subtle)
    document.addEventListener('mousemove', function (e) {
        if (!document.querySelector('.photo-frames.show')) return;
        var mx = (e.clientX / window.innerWidth - 0.5) * 14;
        var my = (e.clientY / window.innerHeight - 0.5) * 14;
        frames.forEach(function (frame, i) {
            var depth = 0.6 + (i % 3) * 0.3;
            frame.style.marginLeft = (mx * depth) + 'px';
            frame.style.marginTop = (my * depth) + 'px';
        });
    });
});
