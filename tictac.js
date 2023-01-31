

function set_arr(arr, value) {
    for (var i = 0; i < arr.length; i++) {
        arr[i] = value;
    }
}

var t_game;

t_game = (function () {

    /**/

    var _grid = new Array(9);

    /* 9 pos of grid*/

    var game = {
        /**
         * state machine:
         *   init -> 0 ( animated choice box down )
         *   0-> 1     ( animate choice box out )
         *   1-> 2     ( animate game grid in )
         *   2 ->3     ( play game, substates : {rc,res} )
         *   3-> 4     animated game result in ( game over, AI won, Player win, or Tie )
         *   4-> 5     animated game result out, animate game grid out
         *   4-> 0     ( animate choice box down )
         * */
        state: {},
        ai_pawn: 0, /* either 'x' or 'o' */
        ai_score: 0,
        human_score: 0,
        tie_score: 0
    };

    var winning_paths = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];

    var btn_handlers = [];

    /*
     some private functions and vars go here
     */

    function did_player_win(player_pawn) {
        var subset = winning_paths.filter(function (subset) {

            var res = subset.reduce(function (prev, cur, idx, arr) {
                    if (_grid[cur] == player_pawn) {

                        prev.cnt++;
                    }
                    return prev;
                },
                {cnt: 0}
            );
            if (res.cnt == 3) {//won!!
                return true;
            }
            return false;
        });
        console.log(subset);
        if (subset && subset.length > 0) {
            if (subset.length > 1) {
                throw new Error('Error, More then 1 player won?' + JSON.stringify(subset));
            }
            return ({ans: true, usr: player_pawn, set: subset[0]});

        }
        return ( {ans: false, usr: player_pawn} );
    }


    function process_move() {

        var x_player = did_player_win('x');
        var o_player = did_player_win('o');

        /*  */

        if (x_player.ans || o_player.ans) {
            game.state = {rc: 3, res: "won", player: o_player.ans ? "o" : 'x'};
        }
        if (is_tie()) {
            game.state = {rc: 3, res: "tie"};
        }
        /**
         DEBUG LOGGING STUFF
         */

        /**
         display grid
         */

    }

    /**
     Common sense obvious moves:
     */

    function is_tie() {
        var idx = _grid.findIndex(function (v) {
            if (v == '0') {
                return true;
            }
            return false;
        });
        return (idx < 0);
    }

    function block_or_win(_set) {
        console.log(_set);
        for (var i = 0; i < _set.length; i++) {
            if (_grid[_set[i]] == "0") {
                _grid[_set[i]] = game.ai_pawn;
                break;
            }
        }
    }

    function can_someone_win_in_next_move(func) {
        /*
         patterns, expressed in positions
         */
        console.log(_grid);
        var result = winning_paths.findIndex(
            function (vset) {
                var can_use_this_set = vset.reduce(function (prev, v) {
                    if (_grid[v] == '0') {
                        return prev;
                    }
                    if (_grid[v] == game.ai_pawn) {
                        prev.ai++;
                        return prev;
                    }
                    if (_grid[v] != game.ai_pawn) {
                        prev.human++;
                        return prev;
                    }
                    // TODO error condition
                    throw new Error('internal fault!!');
                }, {ai: 0, human: 0});
                //evaluate
                console.log(can_use_this_set);
                return ( func(can_use_this_set) ); // we found a set where we can win

            });
        return result; //yes you can win in this index position

    }

    function can_human_win() {
        /* patterns, expressed in positions */
        var human_win = can_someone_win_in_next_move(function (obj) {

            return (obj.human == 2 && obj.ai == 0);

        });

        if (human_win >= 0) {//  prevent human from winning
            block_or_win(winning_paths[human_win]);
            console.log('human could have won in next move, blocked!');
            return true;
        }
        return false; // this move was played
    }

    function can_AI_win() {
        /* patterns, expressed in positions */
        var ai_win = can_someone_win_in_next_move(function (obj) {

            return (obj.human == 0 && obj.ai == 2);

        });

        if (ai_win >= 0) {// win outright in next move
            block_or_win(winning_paths[ai_win]);
            console.log('AI can win in next move, go for it!');
            return true;
        }
        return false; //this move was played
    }


    /* AI , dont make it too smart */
    function pick_random_move() {
        // can i claim center, if it can
        if (_grid[4] == "0"){
            _grid[4] = game.ai_pawn;
            return 4;
        }

        // find empty spots and select random one
        var temp = _grid.reduce(function (prev, v, idx) {
            if (v == "0") {
                //console.log(idx + '-->' + v);
                prev.push(idx);
            }
            return prev;
        }, []);
        // 0--1--2--3--4//--i
        var rand = Math.random();
        var idx = rand * (temp.length);
        var pickler = Math.trunc(idx);
        var pos = temp[pickler];

        _grid[pos] = game.ai_pawn;

        return temp[pickler];

    }


    function eval_next_move() {
        if (!can_AI_win()) {
            if (!can_human_win()) {
                pick_random_move();
            }
        }
        process_move();
    }

    /* UI functions and event handling */
    /* UI functions and event handling */
    /* UI functions and event handling */

    function arr_from_node_list( nl ) {

        var rc = [];

        for (var i = 0; i < nl.length; i++) {
            rc.push(nl.item(i));
        }

        return rc;
    }

    function wrap_button_evt_handler(func, value) {

        return function (evt) {
            evt.extra = value; //enrich event
            func(evt);
        }

    }

    function set_content(ids, value) {

        if (!(ids instanceof Array)) {
            ids = [ids];
        }

        for (var i = 0; i < ids.length; i++) {
            var ui = document.querySelector(ids[i]);
            if (!ui) {
                throw new Error("oops, no #" + id + " found in DOM");
            }
            ui.textContent = ( value != undefined ? '' + value : '');
        }

        return ui;
    }

    function expose(id) {
        var ui = document.querySelector(id);
        if (!ui) {
            throw new Error("oops, no #" + id + " found in DOM");
        }
        return ui;
    }

    /*
     example:
     add_classes(elt, "class1").remove_classes("class3");
     */

    function add_classes(elt, arr) {

        if (typeof elt == "string"){
            elt = expose(elt);
        }

        if (!(arr instanceof Array)) {
            arr = [arr];
        }
        arr.forEach(function (_class) {
            elt.classList.add(_class);
        });

        var k = remove_classes.bind(undefined, elt);

        return {
            remove_classes: k
        };
    }

    /*
     example:
     remove_classes(elt, "class1").add_classes("class3");
     */

    function remove_classes(elt, arr) {

        if (typeof elt == "string"){
            elt = expose(elt);
        }

        if (!(arr instanceof Array)) {
            arr = [arr];
        }

        arr.forEach(function (_class) {
            elt.classList.remove(_class);
        });

        var k = add_classes.bind(undefined,elt);

        return {
            add_classes: k
        }
    }

    /* game end result */
    /* game end result */
    /* game end result */


    function end_animation_notify_box( evt ){

        var next = expose("#next");

        if (evt.extra.o == "in"){
            next.addEventListener( "click", dlg_bnt_next);
            dialog.removeEventListener( "animationend" , end_fade_in_notify_box);
            dialog.addEventListener( "animationend" , end_fade_out_notify_box);
        }

        if (evt.extra.o == "out") {
            dunk_notify_box();
            /* start new game */
            /* start new game */
            /* start new game */
            turn_on_buttons();
            game.ai_pawn = (game.ai_pawn == "x") ? "o" : "x";
            init.reset();
            update_game_board();
        }
    }

    var end_fade_in_notify_box = wrap_button_evt_handler(end_animation_notify_box,{o:"in"});
    var end_fade_out_notify_box = wrap_button_evt_handler(end_animation_notify_box,{o:"out"});


    function  dlg_bnt_next( evt ) {

        var dialog = expose("#dialog");

        remove_classes( dialog , ["fadeInDown", "faceOutUp", "animated"] );
        add_classes(dialog, ["fadeOutUp", "animated"]);
        remove_classes( "#backdrop", "in");
    }


    function show_notification_dlg(){

        var dialog = expose("#dialog");
        var dlg_class = [];

        if (game.state.res == "won"){
            if (game.state.player == game.ai_pawn){
                dlg_class.push("ai");
            }
            else{
                dlg_class.push("usr");
            }
        }
        else {
           dlg_class.push("tie");
        }

        if (game.ai_pawn == "x"){
            dlg_class.push("xx");
        }
        else {
            dlg_class.push("oo");
        }
        add_classes(dialog, dlg_class);
        //dialog.addEventListener( "animationend" ,end_animation_notify_box);
        dialog.addEventListener( "animationend" , end_fade_in_notify_box);
        dialog.removeEventListener( "animationend" , end_fade_out_notify_box);

        add_classes("#backdrop",["in"]);
        add_classes("#modal-canvas",["in"]);
        add_classes(dialog,["fadeInDown","animated"]);

    }

    function dunk_notify_box(){

        remove_classes( "#backdrop", "in");
        remove_classes( "#modal-canvas", "in");
        var dialog = expose("#dialog");
        remove_classes( dialog , ["fadeInDown","fadeOutUp","animated","xx","usr","oo","ai","tie"]);
        dialog.removeEventListener( "animationend" , end_fade_in_notify_box);
        dialog.removeEventListener( "animationend" , end_fade_out_notify_box);
        expose("#next").removeEventListener( "click" , dlg_bnt_next);

    }


    /* game grid */
    /* game grid */
    /* game grid */

    function update_game_board() {

        for (var i = 0; i < 9; i++){
            var elt = expose("#cell"+i);
            var val = _grid[i];
            switch ( val ){
                case 0:
                    add_classes(elt, "allow").remove_classes(["fa","fa-circle-o","fa-times","red-text","black-txt"]);
                    break;
                case 'x':
                    add_classes(elt, ["fa","fa-times","black-txt"]).remove_classes(["allow","fa-circle-o","red-txt"]);
                    elt.removeEventListener("click", btn_handlers[i] );
                    break;
                case 'o':
                    add_classes( elt, ["fa","fa-circle-o","red-txt"]).remove_classes(["allow","fa-times","black-txt"]);
                    elt.removeEventListener("click", btn_handlers[i] );
                    break;
                default:
                    remove_classes(elt, "allow");
                    elt.removeEventListener("click", btn_handlers[i] );
            }
        }

        /* update scores */

        set_content("#human-score", game.human_score);
        set_content("#tie-score", game.tie_score);
        set_content("#ai-score", game.ai_score);


    }

    function grid_pos_selected(evt) {
        var btn_list, idx, btn, dialog;
        var pos = evt.extra.btn_id;
        init.move({position:pos});
        /* check if someone won or not */
        if (game.state.res) {
            if (game.state.res == "won") {
                if (game.state.player == game.ai_pawn) {
                    game.ai_score++;
                }
                else {
                    game.human_score++;
                }
            }
            if (game.state.res == "tie") {
                game.tie_score++;
            }
            console.log("disabling-grid");
            for (idx = 0; idx < 9; idx++){
                if ( _grid[idx] == '0'){
                    _grid[idx] = "-";
                }
            }
        }
        update_game_board();
        if (game.state.res){
            dunk_notify_box();
            show_notification_dlg();
        }
    }


    function dunk_buttons() {

        for (var i= 0; i < 9 ; i++){
            var btn = expose("#cell"+i);
            btn.removeEventListener("click", btn_handlers[ i ]);
            remove_classes(btn, ["allow","black-txt" ,"red-txt","fa", "fa-times", "fa-circle-o"]);
        }
    }

    function turn_on_buttons() {
        for (var i= 0; i < 9 ; i++){
            var btn = expose("#cell"+i);
            btn.addEventListener("click", btn_handlers[i]);
            add_classes(btn, ["allow"]);
        }
    }

    function dunk_game_grid() {

        var game_box = expose("#game");
        add_classes(game_box, "hide");
        remove_classes(game_box, ["animated", "zoomIn", "zoomOut", "clickable"]);

        var game_grid = expose("#game-grid");
        remove_classes(game_grid, "clickable");

        dunk_buttons();
    }

    function end_animation_game_grid() {
        console.log('animation game grid ended');
        var game_box = expose("#game");
        remove_classes(game_box, ["animated", "zoomIn", "zoomOut"]);

        if (game.state.rc == 2) {
            turn_on_buttons();
            game_box.removeEventListener("animationend", end_animation_game_grid);

            /* start new game */
            /* start new game */
            /* start new game */

            init.reset();
            update_game_board();

            return;
        }
        remove_classes(gam_box, "clickable");
        //TODO comming from state 4 (after notification)
    }


    function zoom_out_game_grid() {
        //TODO

    }

    function zoom_in_game_grid() {
        var game = expose("#game");
        add_classes(game, ["animated", "zoomIn", "clickable"]);
        game.addEventListener("animationend", end_animation_game_grid);
        remove_classes(game, "hide");//fire it off
    }


    /* choice box */
    /* choice box */
    /* choice box */

    function end_animation_choice_box(evt) {

        var txt_descr;
        var btnz;
        var bnt_x_choose;
        var bnt_o_choose;
        var m_choice_box;
        game.state.cnt--;
        console.log(game.state);

        if (game.state.cnt == 0) { /* fade in animation ended */

            m_choice_box = expose("#make-choice");
            txt_descr = expose("#descr-choice");
            btnz = expose("#choice-btnz");

            bnt_x_choose = expose("#select-cross");
            bnt_o_choose = expose("#select-circle");

            if (game.state.rc == 0) {    /* animation fade in */
                add_classes(btnz, "clickable");
                bnt_x_choose.addEventListener("click", x_choose);
                bnt_o_choose.addEventListener("click", o_choose);
                console.log('event listeners added');
            }
            else {                     /* animation fade out */
                remove_classes(btnz, "clickable");
                bnt_x_choose.removeEventListener("click", x_choose);
                bnt_o_choose.removeEventListener("click", o_choose);
                add_classes(m_choice_box, "hide");
                console.log('event listeners removed');
                /* MOVE TO NEXT STATE BRING IN GAME GRID */
                dunk_game_grid();
                game.state = {rc: 2, cnt: 1};
                zoom_in_game_grid();

                dunk_notify_box();
                //TODO fade_in_game_grid()
            }

            remove_classes(txt_descr, ["fadeInDown", "fadeOutUp", "animated"]);
            remove_classes(btnz, ["animated", "fadeOutDown", "fadeInUp"]);

            txt_descr.removeEventListener("animationend", end_animation_choice_box);
            btnz.removeEventListener("animationend", end_animation_choice_box);
        }
    }


    function dunk_choice_box() {
        var m_choice_box = expose("#make-choice");
        var txt_descr = expose("#descr-choice");
        var btnz = expose("#choice-btnz");
        var bnt_x_choose = expose("#select-cross");
        var bnt_o_choose = expose("#select-circle");

        add_classes(m_choice_box, "hide");
        remove_classes(txt_descr, ["fadeInDown", "animated"]);
        remove_classes(btnz, ["clickable", "animated", "fadeOutDown", "fadeInUp"]);
        txt_descr.removeEventListener("animationend", end_animation_choice_box);
        btnz.removeEventListener("animationend", end_animation_choice_box);

        bnt_x_choose.removeEventListener("click", x_choose);
        bnt_o_choose.removeEventListener("click", o_choose);

    }

    function fade_in_choice_box() {

        var m_choice_box = expose("#make-choice");
        var txt_descr = expose("#descr-choice");
        var btnz = expose("#choice-btnz");

        var bnt_x_choose = expose("#select-cross");
        var bnt_o_choose = expose("#select-circle");

        add_classes(txt_descr, ["fadeInDown", "animated"]);
        add_classes(btnz, ["fadeInUp", "animated"]);

        /* */
        remove_classes(m_choice_box, "hide"); //fire it off

        /* */
        txt_descr.addEventListener("animationend", end_animation_choice_box);
        btnz.addEventListener("animationend", end_animation_choice_box);

        /* */
        bnt_x_choose.addEventListener("click", x_choose);
        bnt_o_choose.addEventListener("click", o_choose);
    }

    function fade_out_choice_box() {

        dunk_game_grid();

        dunk_notify_box();

        /* disable choice buttons */

        var bnt_x_choose = expose("#select-cross");
        var bnt_o_choose = expose("#select-circle");
        bnt_x_choose.removeEventListener("click", x_choose);
        bnt_o_choose.removeEventListener("click", o_choose);

        /* disable button hover animaton */

        var btnz = expose("#choice-btnz");
        remove_classes(btnz, "clickable");

        var txt_descr = expose("#descr-choice");

        add_classes(txt_descr, ["fadeOutUp", "animated"]);
        add_classes(btnz, ["fadeOutDown", "animated"]);

        txt_descr.addEventListener("animationend", end_animation_choice_box);
        btnz.addEventListener("animationend", end_animation_choice_box);

    }


    function choice(evt) {
        console.log({t: 'choice_made:', d: evt.extra});
        game.ai_pawn = (evt.extra.pawn == 'x' ? 'o' : 'x');
        game.state = {rc: 1, cnt: 2};
        fade_out_choice_box();
    }

    var x_choose = wrap_button_evt_handler(choice, {pawn: "x"});
    var o_choose = wrap_button_evt_handler(choice, {pawn: "o"});






    /* public interface */
    function init() {
        var i;
        set_arr(_grid, 0);
        game.ai_pawn = 0;
        game.state = 0;

        dunk_choice_box();
        set_content(["#human-score", "#tie-score", "#ai-score"], 0);
        dunk_game_grid();
        dunk_notify_box();
        game.state = {rc: 0, cnt: 2};
        fade_in_choice_box();

        /* only do this once, pre-cook handlers */
        for (i = 0; i < 9; i++) {
            var func = wrap_button_evt_handler(grid_pos_selected, {btn_id: i});
            btn_handlers.push(func);
        }
        /* remove this*/

    }

    /* reset game */
    init.reset = function () {

        set_arr(_grid, 0);

        game.state = {rc: 3};

        if (game.ai_pawn == "x") {
            _grid[4] = game.ai_pawn; // best first move
        }

        return;
    };

    /*user makes move */
    init.move = function (move) {

        if (game.state.rc != 3) {
            throw new Error('game not initialized');
        }

        if (!move) {
            throw new Error('move argument not defined');
        }

        if (move.position == undefined) {
            throw new Error('move.position not defined');
        }

        if (typeof move.position != "number") {
            throw new Error('move position should be a number.');
        }

        if (move.position < 0 || move.position > 8 || _grid[move.position] != 0) {
            throw new Error('move position not available.');
        }

        _grid[move.position] = (game.ai_pawn == 'x' ? 'o' : 'x');

        process_move();
        if (game.state.res == undefined) {
            eval_next_move(); //process_move() is called here
        }

        return ;

    };
    console.log('returning init');
    return init;


})();


window.onload = t_game;