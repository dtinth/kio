import { useStore } from "@nanostores/react";
import { atom } from "nanostores";
import { ofetch } from "ofetch";
import pDefer from "p-defer";
import { Fragment, useEffect } from "react";
import type { CheckInResult, Info, UndoResult } from "../../types";

const $output = atom<React.ReactNode[]>([]);

let nextId = 1;
const write = (node: React.ReactNode) => {
  $output.set([...$output.get(), <Fragment key={nextId++}>{node}</Fragment>]);
};
const writeLine = (node: React.ReactNode) => {
  write(
    <>
      {node}
      <br />
    </>
  );
};
const clear = () => {
  $output.set([]);
};

let booted = false;
async function boot() {
  const base =
    new URLSearchParams(location.search).get("backend") ||
    "https://mockapis.onrender.com/dtinth/kio/events/demo";
  if (booted) return;
  booted = true;
  write("Loading...");

  const info = await ofetch<Info>(`${base}/info`);
  let checkedIn = info.checkedIn;

  console.log(info);
  const showHead = () => {
    clear();
    writeLine(
      <>
        Welcome to <strong>{info.eventTitle}</strong>
        <br />
        <span className="text-gray-500">{checkedIn} checked in</span>
        <br />
      </>
    );
  };
  let lastCode = "";
  let bufferedText = "";
  for (;;) {
    showHead();
    write("Present your QR code: ");
    const code = (bufferedText || (await line.promise)).toUpperCase().trim();
    writeLine(null);
    bufferedText = "";

    if (code === "UNDO") {
      writeLine("Working on it...");
      const result = await ofetch<UndoResult>(`${base}/checkOut`, {
        method: "POST",
        body: { refCode: lastCode },
      });
      console.log("UndoResult", result);
      for (const ticket of result.undoneTickets) {
        writeLine(
          `Undone check-in for “${ticket.firstname} ${ticket.lastname}”`
        );
      }
    } else if (code) {
      writeLine("Checking your information...");
      lastCode = code;

      const result = await ofetch<CheckInResult>(`${base}/checkIn`, {
        method: "POST",
        body: { refCode: code },
      });
      console.log("CheckInResult", result);
      checkedIn = result.checkedIn;
      const tixs = [
        ...(result.checkedInTickets || []),
        ...(result.usedTickets || []),
      ];
      showHead();
      for (const ticket of tixs) {
        const ticketType = info.ticketTypes.find(
          (t) => t.id === ticket.ticketTypeId
        );
        writeLine(
          <div className="whitespace-pre-wrap">
            <strong
              data-testid="Check-in result"
              data-result={
                result.usedTickets.includes(ticket)
                  ? "Already used"
                  : "Checked in"
              }
              className={
                (result.usedTickets.includes(ticket)
                  ? "bg-blue-600"
                  : "bg-green-600") + " text-white"
              }
            >
              {" Checked in "}
            </strong>{" "}
            {ticket.firstname} {ticket.lastname}
            <br />
            {"             "}
            {ticketType?.name}
          </div>
        );
        writeLine(null);
      }
      if (tixs.length === 0) {
        writeLine(
          <div className="whitespace-pre-wrap">
            <strong className="bg-red-600 text-white">{" Error "}</strong>{" "}
            <span className="text-red-400">Invalid code, sorry...</span>
          </div>
        );
      } else {
        writeLine(
          <strong className="text-yellow-400">Enjoy the event!</strong>
        );
      }
    } else {
      showHead();
      writeLine(
        <div className="whitespace-pre-wrap">
          <strong className="bg-red-600 text-white">{" Error "}</strong>{" "}
          <span className="text-red-400">Please enter a code...</span>
        </div>
      );
    }
    bufferedText = await Promise.race([
      new Promise<string>((resolve) => setTimeout(() => resolve(""), 5000)),
      line.promise,
    ]);
  }
}

function createLineReader() {
  let buffer = "";
  let deferred = pDefer<string>();
  return {
    add: (character: string) => {
      buffer += character;
    },
    submit: () => {
      deferred.resolve(buffer);
      buffer = "";
      deferred = pDefer<string>();
    },
    get promise() {
      return deferred.promise;
    },
  };
}

let line = createLineReader();

function onKeyPress(e: Pick<KeyboardEvent, "key">) {
  console.log("onKeyPress", { key: e.key });
  if (e.key === "Enter") {
    console.log("Enter pressed");
    line.submit();
  } else if (e.key.length === 1) {
    write(<span className="text-sky-400">*</span>);
    line.add(e.key);
  }
}

async function onMessage(e: MessageEvent) {
  if (typeof e.data?.text === "string") {
    const text = e.data.text;
    if (text.match(/^[A-Z0-9]*$/)) {
      for (const char of text) {
        onKeyPress({ key: char });
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      onKeyPress({ key: "Enter" });
    }
  }
}

export function Kiosk() {
  useEffect(() => {
    boot();
    window.addEventListener("keypress", onKeyPress);
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("keypress", onKeyPress);
      window.removeEventListener("message", onMessage);
    };
  }, []);
  const output = useStore($output);
  return <>{output}</>;
}
