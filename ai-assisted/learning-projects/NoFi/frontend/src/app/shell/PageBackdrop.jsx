const common = { fill: "none", stroke: "currentColor", strokeWidth: "5", strokeLinecap: "round", strokeLinejoin: "round" };

function HomeArt() {
  return <>
    <g transform="translate(92 88) rotate(-22)"><path d="M112 0v235M82 0h60v78H82zM112 235c-70 0-70 110 0 110s70-110 0-110z" {...common} /><path d="M75 275h74M112 235v110" {...common} /></g>
    <path d="M570 110v104m0-104h42v-35m-42 88c-28 0-28 40 0 40s28-40 0-40m42-18c-28 0-28 40 0 40s28-40 0-40" {...common} />
    <path d="M525 450l12 25 28 3-21 19 6 28-25-14-25 14 6-28-21-19 28-3z" {...common} />
  </>;
}

function LibraryArt() {
  return <>
    <g transform="translate(66 140) rotate(-6)"><rect width="330" height="155" rx="13" {...common} /><path d="M0 64h330M33 64v91m33-91v91m33-91v91m33-91v91m33-91v91m33-91v91m33-91v91m33-91v91m33-91v91" {...common} /><path d="M49 64v52m66-52v52m66-52v52m66-52v52" {...common} /></g>
    <path d="M535 135c110-45 172 16 206 73" {...common} /><path d="M536 135l20 42" {...common} />
  </>;
}

function AddArt() {
  return <>
    <g transform="translate(80 120)"><rect width="260" height="170" rx="25" {...common} /><circle cx="63" cy="87" r="32" {...common} /><circle cx="196" cy="87" r="32" {...common} /><path d="M104 42h89v25h-89zM99 130h105M122 148h60" {...common} /><path d="M30 0l-16-56M55 0l-5-61" {...common} /></g>
    <path d="M500 170c50-70 100 70 150 0s100 70 150 0" {...common} />
    <path d="M490 205c50-70 100 70 150 0s100 70 150 0" {...common} />
    <path d="M510 435h220M510 465h160M510 495h190" {...common} />
  </>;
}

function PlayingArt() {
  return <>
    <g transform="translate(80 170)"><rect width="240" height="190" rx="20" {...common} /><circle cx="72" cy="96" r="42" {...common} /><circle cx="168" cy="96" r="42" {...common} /><path d="M30 158h180" {...common} /></g>
    <path d="M510 95v265M555 145v165M600 105v245M645 180v115M690 125v210" {...common} />
    <path d="M430 500c70-125 160-125 230 0" {...common} /><path d="M455 520c55-92 125-92 180 0" {...common} />
  </>;
}

function SettingsArt() {
  return <>
    <path d="M95 85h295M95 125h230M95 165h270M95 205h205M95 245h260M95 285h180M95 325h285M95 365h220M95 405h260" {...common} />
    <path d="M65 80v350" {...common} />
    <g transform="translate(520 105) rotate(12)"><path d="M30 120C-35 120-35 0 30 0h135c65 0 65 120 0 120M30 60h135M0 120v78M195 120v78M0 198c0 35 45 35 45 0m105 0c0 35 45 35 45 0" {...common} /></g>
    <g transform="translate(560 440)"><path d="M0 22l22 22L66 0M88 22l22 22L154 0" {...common} /></g>
  </>;
}

export default function PageBackdrop({ page }) {
  const art = { home: <HomeArt />, library: <LibraryArt />, add: <AddArt />, playing: <PlayingArt />, settings: <SettingsArt /> }[page];
  return <svg className={`page-backdrop page-backdrop--${page}`} viewBox="0 0 820 620" preserveAspectRatio="xMidYMid meet" aria-hidden="true">{art}</svg>;
}

