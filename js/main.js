(function () {
    var menu = document.getElementById('menu');
    var menuTlacidlo = document.querySelector('.menu-tlacidlo');
    var rozbal = document.querySelectorAll('.menu-rozbal');

    var zavriSkupiny = function (okrem) {
        Array.prototype.forEach.call(rozbal, function (tlacidlo) {
            if (tlacidlo !== okrem) {
                tlacidlo.setAttribute('aria-expanded', 'false');
                tlacidlo.parentNode.classList.remove('je-otvorene');
            }
        });
    };

    Array.prototype.forEach.call(rozbal, function (tlacidlo) {
        tlacidlo.addEventListener('click', function () {
            var otvorene = tlacidlo.parentNode.classList.toggle('je-otvorene');
            tlacidlo.setAttribute('aria-expanded', otvorene ? 'true' : 'false');
            zavriSkupiny(tlacidlo);
        });
    });

    document.addEventListener('click', function (e) {
        if (!e.target.closest('.menu-skupina')) {
            zavriSkupiny(null);
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            var otvorena = document.querySelector('.menu-skupina.je-otvorene .menu-rozbal');
            zavriSkupiny(null);
            if (otvorena) { otvorena.focus(); }
        }
    });

    if (menu && menuTlacidlo) {
        menuTlacidlo.addEventListener('click', function () {
            var otvorene = menu.classList.toggle('je-otvorene');
            menuTlacidlo.setAttribute('aria-expanded', otvorene ? 'true' : 'false');
        });

        menu.addEventListener('click', function (e) {
            if (e.target.tagName === 'A') {
                menu.classList.remove('je-otvorene');
                menuTlacidlo.setAttribute('aria-expanded', 'false');
                zavriSkupiny(null);
            }
        });
    }

    var zapisNahradne = function (text) {
        return new Promise(function (hotovo, chyba) {
            var pole = document.createElement('textarea');
            pole.value = text;
            pole.setAttribute('readonly', '');
            pole.style.position = 'fixed';
            pole.style.opacity = '0';
            document.body.appendChild(pole);
            pole.select();
            var ok = document.execCommand('copy');
            document.body.removeChild(pole);
            if (ok) { hotovo(); } else { chyba(); }
        });
    };

    var zapisDoSchranky = function (text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text).catch(function () {
                return zapisNahradne(text);
            });
        }
        return zapisNahradne(text);
    };

    Array.prototype.forEach.call(document.querySelectorAll('[data-kopirovat]'), function (tlacidlo) {
        var casovac = null;
        tlacidlo.addEventListener('click', function () {
            zapisDoSchranky(tlacidlo.getAttribute('data-kopirovat')).then(function () {
                tlacidlo.classList.add('je-skopirovane');
                var text = tlacidlo.querySelector('span:not(.kopirovat-ok)');
                if (text && !text.hasAttribute('data-povodny')) {
                    text.setAttribute('data-povodny', text.textContent);
                }
                if (text) { text.textContent = 'Skopírované'; }
                clearTimeout(casovac);
                casovac = setTimeout(function () {
                    tlacidlo.classList.remove('je-skopirovane');
                    if (text) { text.textContent = text.getAttribute('data-povodny'); }
                }, 1600);
            });
        });
    });

    var naVrch = document.querySelector('.na-vrch');
    if (naVrch) {
        var ukaz = function () {
            var videt = window.pageYOffset > 600;
            naVrch.classList.toggle('je-videt', videt);
            naVrch.tabIndex = videt ? 0 : -1;
        };

        naVrch.addEventListener('click', function () {
            var pokojne = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            window.scrollTo({ top: 0, behavior: pokojne ? 'auto' : 'smooth' });
        });

        window.addEventListener('scroll', ukaz, { passive: true });
        ukaz();
    }

    var pokrytie = document.getElementById('pokrytie');
    var mapa = pokrytie ? pokrytie.querySelector('.mapa') : null;
    if (mapa) {
        var spat = pokrytie.querySelector('.mapa-spat');
        var prepinac = pokrytie.querySelectorAll('.pokrytie-prepinac button');
        var oblasti = pokrytie.querySelectorAll('.mapa-oblast');
        var zoznamy = pokrytie.querySelectorAll('.pokrytie-obce');
        var obce = pokrytie.querySelectorAll('[data-obec]');
        var celaMapa = mapa.getAttribute('viewBox').split(' ').map(Number);
        var aktualna = celaMapa.slice();
        var animacia = null;
        var vybrana = null;
        var mobil = window.matchMedia('(max-width: 600px)');

        var vyrezOblasti = function (oblast) {
            return oblast.getAttribute(mobil.matches ? 'data-vyrez-mobil' : 'data-vyrez').split(' ').map(Number);
        };

        var posun = function (ciel) {
            var zaciatok = aktualna.slice();
            var cas = null;
            var pokojne = mobil.matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            cancelAnimationFrame(animacia);
            var krok = function (teraz) {
                if (cas === null) { cas = teraz; }
                var t = pokojne ? 1 : Math.min((teraz - cas) / 700, 1);
                var e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
                aktualna = zaciatok.map(function (hodnota, i) { return hodnota + (ciel[i] - hodnota) * e; });
                mapa.setAttribute('viewBox', aktualna.join(' '));
                if (t < 1) { animacia = requestAnimationFrame(krok); }
            };
            animacia = requestAnimationFrame(krok);
        };

        var priblizit = function (oblast) {
            if (mapa.classList.contains('je-priblizena')) { return; }
            var kluc = oblast.getAttribute('data-oblast');
            mapa.classList.add('je-priblizena');
            stitkyObci();
            Array.prototype.forEach.call(oblasti, function (ina) {
                ina.classList.toggle('je-vybrana', ina.getAttribute('data-oblast') === kluc);
            });
            vybrana = oblast;
            posun(vyrezOblasti(oblast));
            spat.hidden = false;
            Array.prototype.forEach.call(zoznamy, function (zoznam) {
                zoznam.hidden = zoznam.getAttribute('data-oblast') !== kluc;
            });
            Array.prototype.forEach.call(prepinac, function (tlacidlo) {
                tlacidlo.setAttribute('aria-pressed', tlacidlo.getAttribute('data-oblast') === kluc ? 'true' : 'false');
            });
        };

        var oblastPodla = function (kluc) {
            return mapa.querySelector('.mapa-oblast[data-oblast="' + kluc + '"]');
        };

        var prepnut = function (oblast) {
            mapa.classList.remove('je-priblizena');
            priblizit(oblast);
        };

        var oddialit = function () {
            mapa.classList.remove('je-priblizena');
            vybrana = null;
            Array.prototype.forEach.call(oblasti, function (oblast) { oblast.classList.remove('je-vybrana'); });
            posun(celaMapa);
            spat.hidden = true;
            Array.prototype.forEach.call(zoznamy, function (zoznam) { zoznam.hidden = true; });
            Array.prototype.forEach.call(prepinac, function (tlacidlo) { tlacidlo.setAttribute('aria-pressed', 'false'); });
        };

        var zmenaSirky = function () {
            if (mobil.matches) {
                prepnut(vybrana || oblastPodla(prepinac[0].getAttribute('data-oblast')));
            } else if (vybrana) {
                prepnut(vybrana);
            }
        };

        if (mobil.addEventListener) {
            mobil.addEventListener('change', zmenaSirky);
        } else {
            mobil.addListener(zmenaSirky);
        }

        Array.prototype.forEach.call(prepinac, function (tlacidlo) {
            tlacidlo.addEventListener('click', function () { prepnut(oblastPodla(tlacidlo.getAttribute('data-oblast'))); });
        });

        Array.prototype.forEach.call(oblasti, function (oblast) {
            oblast.addEventListener('click', function () { priblizit(oblast); });
            oblast.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    priblizit(oblast);
                }
            });
        });

        spat.addEventListener('click', oddialit);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !mobil.matches && mapa.classList.contains('je-priblizena')) { oddialit(); }
        });

        var platno = document.createElement('canvas').getContext('2d');

        var stitkyObci = function () {
            Array.prototype.forEach.call(mapa.querySelectorAll('.mapa-meno:not(.mapa-meno-sused)'), function (text) {
                var styl = window.getComputedStyle(text);
                var velkost = parseFloat(text.getAttribute('font-size'));
                platno.font = styl.fontWeight + ' 100px ' + styl.fontFamily;
                var sirka = platno.measureText(text.textContent).width * velkost / 100;
                var box = { x: parseFloat(text.getAttribute('x')) - sirka / 2, width: sirka };
                var stred = parseFloat(text.getAttribute('y')) - velkost * 0.35;
                var stitok = text.previousElementSibling;
                if (!stitok || stitok.getAttribute('class') !== 'mapa-meno-pozadie') {
                    stitok = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    stitok.setAttribute('class', 'mapa-meno-pozadie');
                    text.parentNode.insertBefore(stitok, text);
                }
                stitok.setAttribute('x', box.x - velkost * 0.6);
                stitok.setAttribute('y', stred - velkost * 0.75);
                stitok.setAttribute('width', box.width + velkost * 1.2);
                stitok.setAttribute('height', velkost * 1.5);
                stitok.setAttribute('rx', velkost * 0.75);
            });
        };

        stitkyObci();
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(stitkyObci);
            document.fonts.addEventListener('loadingdone', stitkyObci);
        }

        var zvyrazniObec = function (nazov, zapnut) {
            Array.prototype.forEach.call(obce, function (prvok) {
                if (prvok.getAttribute('data-obec') === nazov) {
                    prvok.classList.toggle('je-zvyraznena', zapnut);
                }
            });
        };

        Array.prototype.forEach.call(obce, function (prvok) {
            var nazov = prvok.getAttribute('data-obec');
            prvok.addEventListener('mouseenter', function () { zvyrazniObec(nazov, true); });
            prvok.addEventListener('mouseleave', function () { zvyrazniObec(nazov, false); });
            prvok.addEventListener('focus', function () { zvyrazniObec(nazov, true); });
            prvok.addEventListener('blur', function () { zvyrazniObec(nazov, false); });
        });

        var hladana = /[?&]oblast=([a-z-]+)/.exec(window.location.search);
        var zvolena = hladana ? oblastPodla(hladana[1]) : null;
        if (zvolena) {
            priblizit(zvolena);
        } else if (mobil.matches && prepinac.length) {
            zmenaSirky();
        }
    }

    if (document.documentElement.classList.contains('animacie')) {
        var vyskaOkna = window.innerHeight || document.documentElement.clientHeight;
        var pozorovatelObjavenia = new IntersectionObserver(function (zaznamy) {
            zaznamy.forEach(function (zaznam) {
                if (zaznam.isIntersecting) {
                    zaznam.target.classList.add('objavene');
                    pozorovatelObjavenia.unobserve(zaznam.target);
                }
            });
        }, { rootMargin: '0px 0px -8% 0px' });
        Array.prototype.forEach.call(document.querySelectorAll('.sekcia-hlava, .dvojica-text > *, .dvojica-obrazok, .vyhody li, .pokrytie-mapa, .otazka, .kontakty > *, .sekcia-odkaz, .predajne > *, .panel, .bok-karta, .dokumenty > *, .cenniky, .poznamka, .meranie'), function (prvok) {
            if (prvok.getBoundingClientRect().top < vyskaOkna) {
                return;
            }
            var poradie = 0;
            var surodenec = prvok.previousElementSibling;
            while (surodenec) {
                if (surodenec.classList.contains('objav')) {
                    poradie++;
                }
                surodenec = surodenec.previousElementSibling;
            }
            prvok.classList.add('objav');
            prvok.style.setProperty('--poradie', Math.min(poradie, 5));
            pozorovatelObjavenia.observe(prvok);
        });
    }

    var volbaCookie = function () {
        var volba = '';
        try {
            volba = localStorage.getItem('compshop-cookie') || '';
        } catch (chybaPamate) {
            volba = '';
        }
        return volba === 'ok' ? 'ano' : volba;
    };

    var meranie = document.querySelector('.meranie[data-src]');
    var nacitajMeranie = function () {
        if (!meranie || meranie.querySelector('iframe')) { return; }
        var ramec = document.createElement('iframe');
        ramec.src = meranie.getAttribute('data-src');
        ramec.title = 'Meranie rýchlosti internetu';
        meranie.innerHTML = '';
        meranie.appendChild(ramec);
    };
    if (meranie) {
        meranie.querySelector('.meranie-spustit').addEventListener('click', nacitajMeranie);
        if (volbaCookie() === 'ano') { nacitajMeranie(); }
    }

    var cookie = document.querySelector('.cookie');
    if (cookie) {
        var ukazCookie = function () {
            cookie.hidden = false;
            document.documentElement.classList.add('cookie-otvorene');
        };
        Array.prototype.forEach.call(cookie.querySelectorAll('[data-volba]'), function (tlacidlo) {
            tlacidlo.addEventListener('click', function () {
                var volba = tlacidlo.getAttribute('data-volba');
                try {
                    localStorage.setItem('compshop-cookie', volba);
                } catch (chybaPamate) {
                    volba = tlacidlo.getAttribute('data-volba');
                }
                cookie.hidden = true;
                document.documentElement.classList.remove('cookie-otvorene');
                if (volba === 'ano') { nacitajMeranie(); }
            });
        });
        Array.prototype.forEach.call(document.querySelectorAll('.cookie-zmenit'), function (tlacidlo) {
            tlacidlo.addEventListener('click', ukazCookie);
        });
        if (!volbaCookie() && !/ochrana-sukromia/.test(window.location.pathname)) {
            ukazCookie();
        }
    }
}());
