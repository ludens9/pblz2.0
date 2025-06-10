// GSAP 및 ScrollTrigger 등록
gsap.registerPlugin(ScrollTrigger);

// 전역 변수
let isContentAnimationComplete = false;
let heroPhysicsEngine;
let heroObjects = [];

// 페이지 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 히어로 섹션 애니메이션 먼저 실행 (페이지 로드시 바로 보이는 부분)
    initializeHeroTitleAnimations();
    
    // 히어로 섹션 물리 엔진 초기화
    initializeHeroPhysics();
    
    // 스크롤 관련 애니메이션들을 순차적으로 초기화
    setTimeout(() => {
        initializeHeaderScrollEffect();
        initializeHeroMediaOverlap();
        initializeContentTextAnimation();
        initializeContentPaddingAnimation();
        // initializeContentBackgroundTransition(); // 배경 변환 인터랙션 제거
        
        // 무한 스크롤 애니메이션 초기화
        initializeInfiniteScroll();
        
        // 클릭 이벤트 초기화
        initializeClickEvents();
        
        // 다른 섹션 제목 애니메이션을 마지막에 초기화 (충돌 방지)
        setTimeout(() => {
            initializeTitleAnimations();
        }, 100);
        
        // 모든 초기화 완료 후 새로고침
        setTimeout(() => {
            ScrollTrigger.refresh();
            console.log("모든 애니메이션 초기화 완료");
        }, 500);
        
    }, 100);
});

// 헤더 스크롤 효과 초기화
function initializeHeaderScrollEffect() {
    const headerFrame = document.querySelector('.header-frame');
    if (!headerFrame) return;
    
    window.addEventListener('scroll', function() {
        const scrollY = window.scrollY;
        
        if (scrollY > 50) {
            headerFrame.classList.add('scrolled');
        } else {
            headerFrame.classList.remove('scrolled');
        }
    });
}

function initializeHeroPhysics() {
    const canvas = document.getElementById('hero-objects-canvas');
    if (!canvas) return;
    
    // Create engine
    heroPhysicsEngine = Matter.Engine.create();
    const render = Matter.Render.create({
        element: canvas.parentElement,
        canvas: canvas,
        engine: heroPhysicsEngine,
        options: {
            width: canvas.offsetWidth,
            height: canvas.offsetHeight,
            wireframes: false,
            background: 'transparent',
            showAngleIndicator: false,
            showVelocity: false
        }
    });
    
    // Create physics world
    const world = heroPhysicsEngine.world;
    
    // Update canvas size function
    function updateCanvasSize() {
        const heroSection = document.querySelector('.hero');
        canvas.width = heroSection.offsetWidth;
        canvas.height = heroSection.offsetHeight;
        render.options.width = canvas.width;
        render.options.height = canvas.height;
        
        // Remove existing boundaries
        const boundaries = Matter.Composite.allBodies(world).filter(body => body.isStatic);
        Matter.Composite.remove(world, boundaries);
        
        // Create boundaries
        const ground = Matter.Bodies.rectangle(
            canvas.width / 2,
            canvas.height + 50,
            canvas.width,
            100,
            { isStatic: true, render: { visible: false } }
        );
        
        const leftWall = Matter.Bodies.rectangle(
            -50,
            canvas.height / 2,
            100,
            canvas.height,
            { isStatic: true, render: { visible: false } }
        );
        
        const rightWall = Matter.Bodies.rectangle(
            canvas.width + 50,
            canvas.height / 2,
            100,
            canvas.height,
            { isStatic: true, render: { visible: false } }
        );
        
        Matter.Composite.add(world, [ground, leftWall, rightWall]);
    }
    
    // Initial canvas setup
    updateCanvasSize();
    
    // Window resize handler (오브젝트 중복 생성 방지)
    window.addEventListener('resize', function() {
        updateCanvasSize();
        // 리사이즈 시에는 새로운 오브젝트를 생성하지 않음 (안정성 확보)
    });
    
    // Set engine properties
    heroPhysicsEngine.world.gravity.y = 2.0;
    
    // Start the render
    Matter.Render.run(render);
    
    // Create a runner
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, heroPhysicsEngine);
    
    // 화면 크기에 따른 스케일 팩터 계산 (사이즈업 적용)
    const isMobile = window.innerWidth <= 768;
    const scaleFactor = isMobile ? 0.33 : 1.2; // 모바일 10% 증가 (0.30 → 0.33), 데스크탑 20% 증가 (1.0 → 1.2)
    
    // 고정된 오브젝트들 정의 (모든 플랫폼에서 동일한 구조, 사이즈만 스케일링)
    const baseObjects = [
        // 직사각형들
        { type: 'rectangle', width: 675, height: 338, color: '#f7f7f7' },
        { type: 'rectangle', width: 405, height: 540, color: '#f7f7f7' },
        { type: 'rectangle', width: 450, height: 450, color: '#f7f7f7' },
        
        // 원형들
        { type: 'circle', radius: 270, color: '#f7f7f7' },
        { type: 'circle', radius: 203, color: '#f7f7f7' },
        { type: 'circle', radius: 338, color: '#f7f7f7' },
        
        // 타원형들
        { type: 'ellipse', width: 540, height: 270, color: '#f7f7f7' },
        { type: 'ellipse', width: 405, height: 675, color: '#f7f7f7' },
        
        // 사다리꼴들
        { type: 'trapezoid', width: 450, height: 338, color: '#f7f7f7' },
        { type: 'trapezoid', width: 405, height: 405, color: '#f7f7f7' }
    ];
    
    // 스케일 팩터 적용
    const fixedObjects = baseObjects.map(obj => {
        const scaledObj = { ...obj };
        if (obj.type === 'circle') {
            scaledObj.radius = Math.round(obj.radius * scaleFactor);
        } else {
            scaledObj.width = Math.round(obj.width * scaleFactor);
            scaledObj.height = Math.round(obj.height * scaleFactor);
        }
        return scaledObj;
    });
    
    // 고정된 위치 배열 (항상 동일한 위치, 화면 크기와 무관)
    const fixedXPositions = [
        0.12,  // 12%
        0.28,  // 28%
        0.45,  // 45%
        0.62,  // 62%
        0.78,  // 78%
        0.88,  // 88%
        0.18,  // 18%
        0.35,  // 35%
        0.65,  // 65%
        0.82   // 82%
    ];
    
    // 오브젝트 생성 함수
    function createAndDropObject(objectDef, index) {
        const canvas = document.getElementById('hero-objects-canvas');
        if (!canvas) return;
        
        let body;
        const x = canvas.width * fixedXPositions[index]; // 고정된 비율 위치 사용
        const y = -(canvas.height * 0.15) - (index * canvas.height * 0.08); // 화면 높이 비율로 순차 배치
        
        // 공통 물리 속성
        const physicsOptions = {
            restitution: 0,
            friction: 0,
            density: 0.003,
            render: { fillStyle: objectDef.color }
        };
        
        switch (objectDef.type) {
            case 'rectangle':
                body = Matter.Bodies.rectangle(x, y, objectDef.width, objectDef.height, physicsOptions);
                break;
                
            case 'circle':
                body = Matter.Bodies.circle(x, y, objectDef.radius, physicsOptions);
                break;
                
            case 'ellipse':
                // Matter.js에서 타원은 스케일된 원으로 구현
                body = Matter.Bodies.circle(x, y, Math.min(objectDef.width, objectDef.height) / 2, physicsOptions);
                Matter.Body.scale(body, objectDef.width / objectDef.height, objectDef.height / objectDef.width);
                break;
                
            case 'trapezoid':
                // 사다리꼴 점 좌표 계산
                const trapWidth = objectDef.width;
                const trapHeight = objectDef.height;
                const topWidth = trapWidth * 0.6; // 위쪽이 60% 크기
                
                const trapVertices = [
                    { x: -topWidth/2, y: -trapHeight/2 },
                    { x: topWidth/2, y: -trapHeight/2 },
                    { x: trapWidth/2, y: trapHeight/2 },
                    { x: -trapWidth/2, y: trapHeight/2 }
                ];
                
                body = Matter.Bodies.fromVertices(x, y, trapVertices, physicsOptions);
                break;
        }
        
        if (body) {
            Matter.Composite.add(heroPhysicsEngine.world, body);
            heroObjects.push(body);
        }
    }
    
    // 모바일용 가운데에서 드롭하는 함수
    function createAndDropObjectCenter(objectDef) {
        const canvas = document.getElementById('hero-objects-canvas');
        if (!canvas) return;
        
        let body;
        const x = canvas.width * 0.5; // 가운데 위치
        const y = -(canvas.height * 0.3); // 화면 위쪽에서 시작
        
        // 공통 물리 속성
        const physicsOptions = {
            restitution: 0,
            friction: 0,
            density: 0.003,
            render: { fillStyle: objectDef.color }
        };
        
        switch (objectDef.type) {
            case 'rectangle':
                body = Matter.Bodies.rectangle(x, y, objectDef.width, objectDef.height, physicsOptions);
                break;
                
            case 'circle':
                body = Matter.Bodies.circle(x, y, objectDef.radius, physicsOptions);
                break;
                
            case 'ellipse':
                body = Matter.Bodies.circle(x, y, Math.min(objectDef.width, objectDef.height) / 2, physicsOptions);
                Matter.Body.scale(body, objectDef.width / objectDef.height, objectDef.height / objectDef.width);
                break;
                
            case 'trapezoid':
                const trapWidth = objectDef.width;
                const trapHeight = objectDef.height;
                const topWidth = trapWidth * 0.6;
                
                const trapVertices = [
                    { x: -topWidth/2, y: -trapHeight/2 },
                    { x: topWidth/2, y: -trapHeight/2 },
                    { x: trapWidth/2, y: trapHeight/2 },
                    { x: -trapWidth/2, y: trapHeight/2 }
                ];
                
                body = Matter.Bodies.fromVertices(x, y, trapVertices, physicsOptions);
                break;
        }
        
        if (body) {
            Matter.Composite.add(heroPhysicsEngine.world, body);
            heroObjects.push(body);
        }
    }
    
    // 모바일에서는 순차적으로 가운데에서 드롭, 데스크탑에서는 기존 방식
    const isMobileDevice = window.innerWidth <= 768;
    
    if (isMobileDevice) {
        // 모바일: 가운데에서 하나씩 순차적으로 1초 안에 모두 드롭
        fixedObjects.forEach((objectDef, index) => {
            setTimeout(() => {
                createAndDropObjectCenter(objectDef);
            }, (index * 100)); // 100ms 간격으로 순차 드롭 (1초 안에 10개 완료)
        });
    } else {
        // 데스크탑: 기존 방식 유지
        fixedObjects.forEach((objectDef, index) => {
            createAndDropObject(objectDef, index);
        });
    }
}

// 히어로 섹션 타이틀 애니메이션 (순차적)
function initializeHeroTitleAnimations() {
    const heroTitle = document.querySelector('.hero .animate-title');
    const heroSubtitle = document.querySelector('.hero .animate-subtitle');
    
    if (heroTitle && heroSubtitle) {
        // 초기 상태 설정
        gsap.set([heroTitle, heroSubtitle], {
            opacity: 0,
            y: 50
        });
        
        // 타이틀 즉시 애니메이션
        gsap.to(heroTitle, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            delay: 0 // 즉시 실행
        });
        
        // 서브타이틀을 바로 이어서 애니메이션
        gsap.to(heroSubtitle, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            delay: 0.2 // 타이틀과 거의 동시에, 약간의 순차 효과만 유지
        });
        
        console.log("히어로 섹션 순차 애니메이션 설정 완료");
    }
}

// 기타 섹션들의 제목과 부제목 애니메이션
function initializeTitleAnimations() {
    // 핀 애니메이션 완료 후 타이틀 애니메이션 설정
    setTimeout(() => {
        // 히어로 섹션 제외한 나머지 섹션들의 애니메이션 요소 선택 (이미지와 버튼 포함)
        const animateElements = document.querySelectorAll('.features .animate-title, .features .animate-subtitle, .features .animate-image, .features .animate-button, .footer .animate-title, .footer .animate-subtitle');
        
        console.log(`Found ${animateElements.length} elements to animate (excluding hero)`);
        
        animateElements.forEach((element, index) => {
            console.log(`Setting up animation for element ${index}:`, element.textContent.substring(0, 30));
            
            // 초기 상태 설정
            gsap.set(element, {
                opacity: 0,
                y: 50
            });
            
            // 애니메이션 설정
            gsap.to(element, {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: "power2.out",
                scrollTrigger: {
                    id: `title-anim-${index}`, // 고유 ID 부여
                    trigger: element,
                    start: "top 90%", // 더 빠른 트리거
                    end: "bottom 30%",
                    toggleActions: "play none none reverse",
                    invalidateOnRefresh: true, // 새로고침시 재계산
                    onEnter: () => console.log(`Animation triggered for: ${element.textContent.substring(0, 30)}`)
                }
            });
        });
        
        // ScrollTrigger 새로고침
        ScrollTrigger.refresh();
    }, 200);
}

// 스크롤 인터랙션 초기화
function initializeScrollAnimations() {
    // 스크롤에 따른 히어로 이미지 스케일링은 별도 함수에서 처리
    // 여기서는 전역 스크롤 이벤트 설정
}

// 히어로 미디어 겹치는 효과
function initializeHeroMediaOverlap() {
    const heroImage = document.getElementById('hero-image');
    const heroVideo = document.getElementById('hero-video');
    if (!heroImage || !heroVideo) return;
    
    ScrollTrigger.create({
        id: "hero-overlap", // 고유 ID 부여
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 0.05, // 더 빠른 반응
        invalidateOnRefresh: true,
        onUpdate: function(self) {
            const progress = self.progress;
            
            // 화면 크기에 따른 오프셋 조정
            const isMobile = window.innerWidth <= 480;
            const isTablet = window.innerWidth <= 768;
            
            let maxOverlap, initialOffset;
            if (isMobile) {
                maxOverlap = 99; // 모바일에서는 사이즈 증가에 맞춘 오프셋
                initialOffset = -9; // 새로운 사이즈에 맞춘 초기 오프셋
            } else if (isTablet) {
                maxOverlap = 121; // 태블릿에서는 사이즈 증가에 맞춘 오프셋
                initialOffset = -11; // 새로운 사이즈에 맞춘 초기 오프셋
            } else {
                maxOverlap = 130; // 데스크탑에서는 최대 오프셋
                initialOffset = -20;
            }
            
            // 두 미디어가 서로 모이는 효과
            const overlapOffset = progress * maxOverlap;
            
            // 이미지는 왼쪽으로, 비디오는 오른쪽으로 서로 모이기
            heroImage.style.right = `${initialOffset - overlapOffset/2}px`; // 이미지가 왼쪽으로
            heroVideo.style.left = `${initialOffset - overlapOffset/2}px`; // 비디오가 오른쪽으로
            
            // 약간의 스케일 효과도 추가
            const scale = 1 + (progress * 0.1); // 1에서 1.1까지
            heroImage.style.transform = `scale(${scale})`;
            heroVideo.style.transform = `scale(${scale})`;
        }
    });
}

// 콘텐츠 텍스트 스크롤 애니메이션
function initializeContentTextAnimation() {
    const scrollText = document.getElementById('scroll-text');
    const contentSection = document.getElementById('content-section');
    
    if (!scrollText || !contentSection) return;
    
    // 원본 HTML 저장 (textContent 대신 innerHTML 사용)
    const originalHTML = scrollText.innerHTML;
    
    // <br> 태그를 줄바꿈 문자로 변환
    const textWithBreaks = originalHTML.replace(/<br\s*\/?>/gi, '\n');
    
    // 텍스트를 단어 단위로 분할하여 span으로 감싸기
    const words = textWithBreaks.split(/(\s+|\n+)/);
    scrollText.innerHTML = words.map(word => {
        if (word.includes('\n')) {
            return word.replace(/\n/g, '<br>'); // 줄바꿈을 다시 <br>로 변환
        } else if (word.trim() === '') {
            return word; // 공백 유지
        } else {
            return `<span class="word" style="color: rgba(255, 255, 255, 0.2);">${word}</span>`;
        }
    }).join('');
    
    const words_elements = scrollText.querySelectorAll('.word');
    
    // 콘텐츠 섹션 고정 및 텍스트 애니메이션
    ScrollTrigger.create({
        id: "content-pin", // 고유 ID 부여
        trigger: contentSection,
        start: "center center",
        end: "+=100%", // 스크롤 거리
        pin: true, // 섹션 고정
        anticipatePin: 1, // 핀 예측 설정
        scrub: 1,
        invalidateOnRefresh: true, // 새로고침시 재계산
        onUpdate: function(self) {
            // 텍스트가 왼쪽에서 오른쪽으로 채워지는 효과
            const progress = self.progress;
            const totalWords = words_elements.length;
            const activeWords = Math.floor(progress * totalWords);
            
            words_elements.forEach((word, index) => {
                if (index <= activeWords) {
                    word.style.color = 'rgba(255, 255, 255, 1)';
                } else {
                    word.style.color = 'rgba(255, 255, 255, 0.2)';
                }
            });
        },
        onComplete: function() {
            // 텍스트 애니메이션 완료
            isContentAnimationComplete = true;
        }
    });
}

// 콘텐츠 섹션 패딩 스크롤 애니메이션
function initializeContentPaddingAnimation() {
    const contentSection = document.querySelector('.content');
    if (!contentSection) return;

    ScrollTrigger.create({
        id: "content-padding", // 고유 ID 부여
        trigger: contentSection,
        start: "top bottom", // 콘텐츠 섹션이 화면에 나타나기 시작할 때
        end: "center center", // 콘텐츠 섹션이 중간에 올 때 패딩이 0에 수렴
        scrub: 1, // 부드러운 스크롤 연동
        invalidateOnRefresh: true,
        onUpdate: function(self) {
            const progress = self.progress; // 0에서 1까지
            
            // 화면 크기에 따른 초기 외부 패딩 값 계산
            const isMobile = window.innerWidth <= 480;
            const isTablet = window.innerWidth <= 768;
            const isSmallDesktop = window.innerWidth <= 1200;
            
            let initialOuterPadding;
            if (isMobile) {
                initialOuterPadding = 4; // 4%
            } else if (isTablet) {
                initialOuterPadding = 5; // 5%
            } else if (isSmallDesktop) {
                initialOuterPadding = 6; // 6%
            } else {
                initialOuterPadding = 8; // 8%
            }
            
            // 외부 패딩만 초기값에서 0으로 감소 (좌우만)
            const currentOuterPadding = initialOuterPadding * (1 - progress);
            
            // 외부 패딩만 적용 (content-frame의 내부 패딩은 CSS에서 고정 유지)
            contentSection.style.padding = `0 ${currentOuterPadding}%`;
        }
    });
}

// 콘텐츠 섹션 배경색 전환 (비활성화됨)
function initializeContentBackgroundTransition() {
    // 배경색 변환 인터랙션 제거됨
    console.log("배경색 변환 인터랙션이 비활성화되었습니다.");
}

// 스크롤 제어 함수들 (현재는 사용하지 않음 - 고정 효과로 대체)
function disableGlobalScroll() {
    // document.body.style.overflow = 'hidden';
}

function enableGlobalScroll() {
    // document.body.style.overflow = 'auto';
}

// 무한 스크롤 애니메이션 초기화
function initializeInfiniteScroll() {
    const track = document.querySelector('.infinite-scroll-track');
    if (!track) return;
    
    const images = track.querySelectorAll('.infinite-scroll-image');
    if (images.length === 0) return;
    
    // 첫 번째 이미지가 로드될 때까지 기다림
    const firstImage = images[0];
    
    function startAnimation() {
        // 실제 이미지 너비 측정
        const imageWidth = firstImage.offsetWidth;
        const gap = 20; // CSS에서 설정한 gap
        
        // 원본 5개 이미지의 총 너비 (gap 포함)
        const singleSetWidth = (imageWidth * 5) + (gap * 4);
        
        // 무한 스크롤을 위해 정확히 하나의 세트만큼 이동
        gsap.set(track, { x: 0 });
        
        // 무한 루프 애니메이션 생성
        gsap.to(track, {
            x: -(singleSetWidth + gap), // 한 세트만큼 + gap 하나 추가로 이동
            duration: 18, // 20% 느리게 (원래 15초 → 18초)
            ease: "none",
            repeat: -1,
            immediateRender: false
        });
        
        console.log(`무한 스크롤 애니메이션 초기화 완료 - 이미지 너비: ${imageWidth}px, 이동 거리: ${singleSetWidth + gap}px`);
    }
    
    // 이미지가 로드되었는지 확인
    if (firstImage.complete && firstImage.naturalWidth !== 0) {
        startAnimation();
    } else {
        // 이미지 로드 완료를 기다림
        firstImage.addEventListener('load', startAnimation);
        // 에러 처리
        firstImage.addEventListener('error', function() {
            console.error('무한 스크롤 이미지 로드 실패');
        });
    }
}

// 성능 최적화를 위한 리사이즈 핸들러
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
        ScrollTrigger.refresh();
        // 리사이즈 시 무한 스크롤도 다시 계산
        initializeInfiniteScroll();
    }, 250);
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', function() {
    if (heroPhysicsEngine) {
        Matter.Engine.clear(heroPhysicsEngine);
    }
    ScrollTrigger.killAll();
});

// 사용자 요청 기능들
function initializeClickEvents() {
    const logo = document.getElementById('logo-button');
    const storeButton = document.getElementById('store-button');
    const shareButton = document.getElementById('share-button');
    const copyPopup = document.getElementById('copy-popup');
    const copyPopupOk = document.getElementById('copy-popup-ok');
    
    const appStoreUrl = 'https://apps.apple.com/us/app/pblz-super-simple-work-tracker/id6738460309';
    
    // 중복 실행 방지를 위한 헬퍼 함수
    function addTouchAndClickEvent(element, handler) {
        let isHandled = false;
        
        // 터치 이벤트 (모바일)
        element.addEventListener('touchstart', function(e) {
            e.preventDefault(); // 기본 터치 동작 방지
            isHandled = true;
            handler();
            // 200ms 후 중복 방지 플래그 리셋
            setTimeout(() => { isHandled = false; }, 200);
        }, { passive: false });
        
        // 클릭 이벤트 (데스크탑 및 폴백)
        element.addEventListener('click', function(e) {
            if (!isHandled) {
                handler();
            }
        });
    }
    
    // 1. 로고 터치/클릭 - 페이지 리프레시 및 최상단 포커스
    if (logo) {
        addTouchAndClickEvent(logo, function() {
            // 페이지 최상단으로 스크롤
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            
            // 페이지 리프레시
            setTimeout(function() {
                window.location.reload();
            }, 300); // 스크롤 애니메이션이 시작된 후 리프레시
        });
    }
    
    // 2. 스토어 이미지 터치/클릭 - 앱스토어 새창 열기
    if (storeButton) {
        addTouchAndClickEvent(storeButton, function() {
            window.open(appStoreUrl, '_blank');
        });
    }
    
    // 3. Share now 버튼 터치/클릭 - 링크 복사 및 팝업 표시
    if (shareButton) {
        addTouchAndClickEvent(shareButton, function() {
            // 클립보드에 링크 복사
            if (navigator.clipboard && window.isSecureContext) {
                // 최신 브라우저에서 클립보드 API 사용
                navigator.clipboard.writeText(appStoreUrl).then(function() {
                    showCopyPopup();
                }).catch(function(err) {
                    console.error('클립보드 복사 실패:', err);
                    fallbackCopyToClipboard(appStoreUrl);
                });
            } else {
                // 구형 브라우저 지원
                fallbackCopyToClipboard(appStoreUrl);
            }
        });
    }
    
    // 팝업 확인 버튼 터치/클릭
    if (copyPopupOk) {
        addTouchAndClickEvent(copyPopupOk, function() {
            hideCopyPopup();
        });
    }
    
    // 팝업 배경 터치/클릭 시 닫기
    if (copyPopup) {
        let isBackgroundHandled = false;
        
        // 터치 이벤트
        copyPopup.addEventListener('touchstart', function(e) {
            if (e.target === copyPopup) {
                e.preventDefault();
                isBackgroundHandled = true;
                hideCopyPopup();
                setTimeout(() => { isBackgroundHandled = false; }, 200);
            }
        }, { passive: false });
        
        // 클릭 이벤트
        copyPopup.addEventListener('click', function(e) {
            if (e.target === copyPopup && !isBackgroundHandled) {
                hideCopyPopup();
            }
        });
    }
}

// 구형 브라우저용 클립보드 복사
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showCopyPopup();
        } else {
            console.error('클립보드 복사 실패');
        }
    } catch (err) {
        console.error('클립보드 복사 오류:', err);
    } finally {
        document.body.removeChild(textArea);
    }
}

// 복사 완료 팝업 표시
function showCopyPopup() {
    const copyPopup = document.getElementById('copy-popup');
    if (copyPopup) {
        copyPopup.classList.add('show');
    }
}

// 복사 완료 팝업 숨기기
function hideCopyPopup() {
    const copyPopup = document.getElementById('copy-popup');
    if (copyPopup) {
        copyPopup.classList.remove('show');
    }
} 