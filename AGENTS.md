<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the Home game-mode catalogue independent from tournament rows so admins can add the first contest for an empty mode.
- Keep tournament team-size options in a shared module so host and admin forms use the same allowed choices.
- Keep clean Home category artwork separate from poster-style tournament artwork so each surface preserves its intended presentation.
- Keep withdrawal requests and history on a dedicated authenticated page while retaining the database payout function; this preserves server-validated balance and settlement rules.
