// 고른 레딧 글을 열어 본문과 맨 위 댓글(깊이 0)을 읽는다. 읽기만.
const fs = await import('node:fs/promises');
const DIR = 'C:/Users/petbl/ego/coop-mp-20261107/';
const task = await taskSpace('coop multiplayer research');
const page = task.page('p1');
const urls = [
  '/r/chess/comments/6ywlvv/a_fun_way_to_play_chess_with_my_wife_who_is_a/',
  '/r/chess/comments/1q8s5ps/tell_me_your_weird_home_rules_for_playing_with/',
  '/r/chess/comments/1v393pj/how_to_get_my_wife_into_chess_without_crushing/',
  '/r/AnarchyChess/comments/qzeaf2/how_can_i_play_chess_with_my_girlfriend_in_a_way/',
  '/r/chessbeginners/comments/1jbsrkx/i_want_to_get_better_at_chess_so_i_can_play_with/',
  '/r/TournamentChess/comments/1w2fwzn/things_to_do_with_a_partner/',
  '/r/AITAH/comments/18b1ha7/aita_for_refusing_to_play_chess_with_my_girlfriend/',
  '/r/chess/comments/1kj8oi0/thoughts_on_cooperative_chess_or_teamed_chess/',
  '/r/chess/comments/1omz5bc/i_built_a_2v2_chess_site_relaychesscom_where_four/',
  '/r/chess/comments/1t1s76h/is_there_a_high_elo_match_where_it_is_2v2_on_one/',
  '/r/chessbeginners/comments/17emc97/anyone_played_doubles_bughouse_what_a_fun_game/',
  '/r/chess/comments/1bfmuko/why_do_people_get_angry_when_i_sit_in_bughouse/',
  '/r/chess/comments/1kout0w/debate_topic_hand_and_brain_chess/',
  '/r/chess/comments/n1iw42/i_just_found_this_and_it_is_amazing_play_hand_and/',
  '/r/Chesscom/comments/1r7944a/have_been_hooked_on_the_4playersmode_and_havent/',
  '/r/CoOpGaming/comments/1xmusba/i_asked_over_100_people_what_goes_wrong_when_they/',
  '/r/CoOpGaming/comments/1of4y3c/how_do_you_keep_coop_games_fun_for_players_with/',
  '/r/CoOpGaming/comments/18qzdhz/howwhat_do_you_play_with_a_partner_who_isnt_good/',
  '/r/boardgames/comments/g2hj7n/a_simple_but_surprisingly_good_solution_for/',
  '/r/tabletopgamedesign/comments/1fsrlg9/best_coop_games_solving_the_quarterback_effect/',
  '/r/TeamfightTactics/comments/vvb5yd/double_up_is_5x_more_fun_than_solos_you_cant/',
  '/r/TeamfightTactics/comments/qzgix8/double_up_fun_in_theory_not_in_practice/',
  '/r/boardgames/comments/t8kwyo/the_crew_how_much_do_you_talk/',
  '/r/chess/comments/1karfq8/solidarity_to_any_parent_of_young_kids_that_tries/'
];
const out = [];
for (const u of urls) {
  try {
    await page.goto('https://www.reddit.com' + u, { timeout: 60000 });
    await page.waitForTimeout(3500);
    const r = await page.evaluate(() => {
      const post = document.querySelector('shreddit-post');
      const body = post?.querySelector('[slot="text-body"]')?.innerText?.trim() || '';
      const comments = [...document.querySelectorAll('shreddit-comment[depth="0"]')].slice(0, 14).map((c) => ({
        score: c.getAttribute('score'),
        text: (c.querySelector('[slot="comment"]')?.innerText || '').trim().slice(0, 700)
      }));
      return { title: post?.getAttribute('post-title'), score: post?.getAttribute('score'), date: post?.getAttribute('created-timestamp')?.slice(0, 10), body: body.slice(0, 1500), comments };
    });
    out.push({ url: 'https://www.reddit.com' + u, ...r });
    console.log('ok', r.comments.length, u);
  } catch (e) { out.push({ url: u, error: String(e).slice(0, 200) }); console.log('err', u); }
}
await fs.writeFile(DIR + 'reddit-posts.json', JSON.stringify(out, null, 1));
