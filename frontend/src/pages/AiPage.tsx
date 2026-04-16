import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { api, type AiConversationDto, type AiMessageDto, type AiMode } from "../lib/api";
import { useI18n } from "../i18n/I18nContext";
import { AiConversationList } from "../components/AiConversationList";
import { AiMascotHeader } from "../components/AiMascotHeader";
import { AiMessageBubble } from "../components/AiMessageBubble";
import { AiModeTabs } from "../components/AiModeTabs";
import { AiReplyPending } from "../components/AiReplyPending";

export function AiPage() {
  const token = useAppStore((s) => s.token);
  const [conversations, setConversations] = useState<AiConversationDto[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessageDto[]>([]);
  const [mode, setMode] = useState<AiMode>("chat");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [mobileDialogsOpen, setMobileDialogsOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { t, lang } = useI18n();

  useEffect(() => {
    const state = location.state as { prefilledMessage?: string } | undefined;
    const draft = state?.prefilledMessage?.trim();
    if (!draft) return;
    setInput((prev) => (prev.trim() ? prev : draft));
  }, [location.pathname, location.state]);

  useEffect(() => {
    if (!mobileDialogsOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileDialogsOpen]);

  useEffect(() => {
    if (!mobileDialogsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileDialogsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileDialogsOpen]);

  const loadConversations = useCallback(async () => {
    if (!token) {
      setConversations([]);
      setActiveId(null);
      setLoadingList(false);
      return;
    }
    setLoadingList(true);
    setConversations([]);
    setActiveId(null);
    setErr(null);
    try {
      const { items } = await api.aiConversations(token, { mode, limit: 50 });
      setConversations(items);
      setActiveId(items[0]?.id ?? null);
    } catch (e) {
      const raw = e instanceof Error ? e.message : t("errors.requestFailed");
      setErr(raw.startsWith("errors.") ? t(raw) : raw);
      setConversations([]);
      setActiveId(null);
    } finally {
      setLoadingList(false);
    }
  }, [token, mode, t]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!token || !activeId) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }
    let cancelled = false;
    setLoadingMessages(true);
    setErr(null);
    api
      .aiMessages(token, activeId)
      .then((res) => {
        if (!cancelled) setMessages(res.items);
      })
      .catch((e) => {
        if (!cancelled) {
          const raw = e instanceof Error ? e.message : t("errors.requestFailed");
          setErr(raw.startsWith("errors.") ? t(raw) : raw);
          setMessages([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, activeId, t]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleNewChat = useCallback(async () => {
    if (!token) return;
    setErr(null);
    try {
      const c = await api.aiCreateConversation(token, { mode });
      setConversations((prev) => [c, ...prev]);
      setActiveId(c.id);
      setMobileDialogsOpen(false);
    } catch (e) {
      const raw = e instanceof Error ? e.message : t("errors.requestFailed");
      setErr(raw.startsWith("errors.") ? t(raw) : raw);
    }
  }, [token, mode, t]);

  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
    setMobileDialogsOpen(false);
  }, []);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || !token || sending) return;
    setInput("");
    setErr(null);
    setSending(true);

    let convId = activeId;
    try {
      if (!convId) {
        const c = await api.aiCreateConversation(token, { mode });
        setConversations((prev) => [c, ...prev]);
        setActiveId(c.id);
        convId = c.id;
      }

      const { mascotMessage, conversation } = await api.aiSendMessage(
        token,
        convId!,
        text,
        { mode, lang }
      );
      const refreshed = await api.aiMessages(token, convId!);
      setMessages(refreshed.items);
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c;
          if (conversation) {
            return { ...c, ...conversation };
          }
          return {
            ...c,
            updatedAt: mascotMessage.createdAt,
            lastMessagePreview:
              mascotMessage.content.length > 120
                ? `${mascotMessage.content.slice(0, 120)}…`
                : mascotMessage.content,
          };
        })
      );
    } catch (e) {
      const raw = e instanceof Error ? e.message : t("errors.requestFailed");
      setErr(raw.startsWith("errors.") ? t(raw) : raw);
      setInput(text);
    } finally {
      setSending(false);
    }
  }, [input, token, sending, activeId, mode, t, lang]);

  const modeLabel = useCallback(
    (k: "chat" | "ideas" | "offer" | "analyze") => t(`ai.mode.${k}`),
    [t]
  );

  const conversationListEl = (
    <AiConversationList
      title={t("ai.conversationsTitle")}
      newChatLabel={t("ai.newChat")}
      onNewChat={() => void handleNewChat()}
      items={conversations}
      activeId={activeId}
      onSelect={selectConversation}
      emptyLabel={t("ai.noConversations")}
      loadingLabel={t("ai.loadingConversations")}
      loading={loadingList}
    />
  );

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <AiModeTabs mode={mode} onChange={setMode} label={modeLabel} />
        <button
          type="button"
          className="rounded-lg border border-zinc-600 bg-zinc-800/80 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700 lg:hidden"
          aria-expanded={mobileDialogsOpen}
          aria-controls="ai-conversations-drawer"
          onClick={() => setMobileDialogsOpen(true)}
        >
          {t("ai.openConversations")}
        </button>
      </div>

      {mobileDialogsOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          id="ai-conversations-drawer"
          role="dialog"
          aria-modal="true"
          aria-label={t("ai.conversationsTitle")}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label={t("ai.closeConversations")}
            onClick={() => setMobileDialogsOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-[min(20rem,88vw)] max-w-full flex-col border-r border-zinc-800 bg-zinc-950 pt-2 shadow-xl">
            <button
              type="button"
              className="absolute right-2 top-2 z-20 rounded-lg px-2 py-1 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white"
              onClick={() => setMobileDialogsOpen(false)}
            >
              {t("ai.closeConversations")}
            </button>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-8">
              {conversationListEl}
            </div>
          </aside>
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-3">
        <aside className="hidden w-full shrink-0 lg:block lg:w-[12.5rem] lg:max-w-[12.5rem]">
          {conversationListEl}
        </aside>

        <section className="flex min-h-[min(520px,62vh)] min-w-0 flex-1 flex-col gap-3">
          <AiMascotHeader
            mascotName={t("ai.mascotName")}
            statusLabel={
              sending ? t("ai.mascotThinking") : t("ai.mascotOnline")
            }
          />

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30">
            <div className="min-h-[min(420px,52vh)] flex-1 overflow-y-auto p-4 [scrollbar-width:thin]">
              {!token && (
                <p className="text-sm text-zinc-500">{t("ai.needLogin")}</p>
              )}
              {token && loadingList && !activeId && (
                <p className="text-sm text-zinc-500">
                  {t("ai.loadingConversations")}
                </p>
              )}
              {token && activeId && loadingMessages && (
                <p className="text-sm text-zinc-500">{t("ai.loadingMessages")}</p>
              )}
              {token &&
                !loadingMessages &&
                activeId &&
                messages.length === 0 && (
                  <p className="text-sm text-zinc-500">{t("ai.emptyHint")}</p>
                )}
              {token && !activeId && !loadingList && (
                <p className="text-sm text-zinc-500">{t("ai.selectOrCreate")}</p>
              )}
              <ul className="space-y-4">
                {messages.map((m) => (
                  <AiMessageBubble key={m.id} message={m} />
                ))}
                {sending && token && (
                  <li className="flex justify-start">
                    <AiReplyPending
                      thinkingLabel={t("ai.replyPendingThinking")}
                      generatingLabel={t("ai.replyPendingGenerating")}
                    />
                  </li>
                )}
              </ul>
              <div ref={bottomRef} />
            </div>

            {err && (
              <p
                className="border-t border-zinc-800 px-4 py-2 text-sm text-red-400"
                role="alert"
              >
                {err}
              </p>
            )}

            <div className="flex flex-col gap-2 border-t border-zinc-800 p-3 sm:flex-row">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder={t("ai.placeholder")}
                rows={2}
                disabled={!token || sending}
                className="min-h-[80px] flex-1 resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40 disabled:opacity-50"
              />
              <button
                type="button"
                disabled={sending || !input.trim() || !token}
                onClick={() => void send()}
                className="h-fit shrink-0 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-sky-100 disabled:opacity-50"
              >
                {sending ? t("common.ellipsis") : t("ai.send")}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
