window.onload = function () {
    'use strict';

    // helper functions
    function randrange(min, max) {
        return min + Math.floor(Math.random() * max);
    }

    function randomColor() {
        var r = Math.floor((randrange(0, 256) + 255) / 2);
        var g = Math.floor((randrange(0, 256) + 255) / 2);
        var b = Math.floor((randrange(0, 256) + 255) / 2);
        var a = 1;
        return 'rgba('+r+','+g+','+b+','+a+')';
    }

    function randomShape(shapeArray) {
        return shapeArray[randrange(0, shapeArray.length)];
    }

    // credit to http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
    function shuffle(array) {
        var currentIndex = array.length, temporaryValue, randomIndex ;
        while (0 !== currentIndex) {
            randomIndex = randrange(0, currentIndex--);
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    }

    function newGrid(shape, color) {
        var grid = '';
        grid += '\n<div class="grid">';
        grid += '\n    <svg viewbox="0 0 100 100" class="slot" fill="black"><use xlink:href="#'+shape+'0" /></svg>';
        grid += '\n    <div class="tile unexposed" angle="0">';
        grid += '\n        <svg viewbox="0 0 100 100" class="front" fill="white"><use xlink:href="#'+shape+'1" /></svg>';
        grid += '\n        <svg viewbox="0 0 100 100" class="back" fill="'+color+'"><use xlink:href="#'+shape+'1" /></svg>';
        grid += '\n    </div>';
        grid += '\n</div>';
        return grid;
    }

    function innerSVGShape(target) {
        if (target.tagName === 'use') {
            return target; // Chrome
        } else if (target.correspondingUseElement) {
            return target.correspondingUseElement; // Safari
        } else {
            return null; // target is not on inner svg shape
        }
    }

    function isOnGridLeftHalf(event, grid) {
        var gridWidth = grid.offsetWidth + parseInt(getComputedStyle(grid)['margin']) * 2;
        return event.x < grid.offsetLeft + gridWidth / 2;
    }

    function flipTo(element, destAngle) {
        element.style['transform'] = 'rotateY('+destAngle+'deg)';
        element.style['-o-transform'] = 'rotateY('+destAngle+'deg)';
        element.style['-moz-transform'] = 'rotateY('+destAngle+'deg)';
        element.style['-webkit-transform'] = 'rotateY('+destAngle+'deg)';
    }

    function flipTile(tile, angle) {
        var destAngle = getAngle(tile) + angle;
        flipTo(tile.children[0], destAngle);    // front
        flipTo(tile.children[1], destAngle+180); // back
        tile.setAttribute('angle', destAngle);
        tile.classList.toggle('unexposed');
    }

    function getAngle(tile) {
        return parseInt(tile.getAttribute('angle'));
    }

    function getColor(tile) {
        return tile.children[1].getAttribute('fill');
    }

    function isExposed(tile) {
        return parseInt(getAngle(tile)) !== 0;
    }

    function setText(id, text) {
        document.getElementById(id).textContent = text;
    }

    // validate the event is on target (the inner shape of a svg)
    // and it's also unexposed.
    function validate(event, handleFn) {
        if (event.target === event.currentTarget || !inPlay) {
            event.stopPropagation();
        } else {
            var shape = innerSVGShape(event.target);
            if (shape) {
                var tile = shape.parentNode.parentNode;
                if (!isExposed(tile)) {
                    handleFn(tile);
                }
            }
        }
    }

    function clickTile(tile) {
        var dirct = isOnGridLeftHalf(event, tile.parentNode) ? -1 : 1;
        flipTile(tile, dirct*180);
        checkMatch();
        match.push(tile);
        addTime();
        if (--count === 0) newGame();
    }

    // game functions
    function addTime() {
        if (match.length === 2) {
            if (getColor(match[0]) === getColor(match[1])) {
                incrementTime(2);
            }
        }
    }

    function checkMatch() {
        if (match.length === 2) {
            var tile1 = match.pop();
            var tile2 = match.pop();
            if (getColor(tile1) !== getColor(tile2)) {
                flipTile(tile1, getAngle(tile1)<0?180:-180);
                flipTile(tile2, getAngle(tile2)<0?180:-180);
                count += 2;
            }
        }
    }

    function incrementTime(amount) {
        time += amount;
        var bonus = document.createElement('span');
        bonus.textContent = '+' + amount;
        bonus.className = 'bonus';
        var div = document.getElementById('timer').parentNode;
        div.appendChild(bonus);
        window.setTimeout(function() {
            div.removeChild(bonus);
        }, 1000);
    }

    function getLevelConfig(_level) {
        switch(_level) {
            case 0: return [3, 3, 20, 'square'];
            case 1: return [3, 3, 2, 'heart'];
            case 2: return [3, 3, 2, ''];
            case 3: return [3, 4, 3, ''];
            case 4: return [4, 4, 4, ''];
            case 5: return [5, 5, 5, ''];
            case 6: return [5, 6, 6, ''];
            case 7: return [5, 7, 7, ''];
            default: return [++rows, cols, 10, ''];
        }
    }

    function newTiles(num, _shape) {
        var tiles = [];
        while (tiles.length < num) {
            var tile = {
                'color': randomColor(),
                'shape': _shape ? _shape : randomShape(SHAPES)
            };
            tiles.push(tile);
            tiles.push(tile);
        }
        return shuffle(tiles);
    }

    function setBoard(shape) {
        var tiles = newTiles(count, shape);
        var grids = '';
        for (var i=0; i<rows; i++) {
            grids += '<div>';
            for (var j=0; j<cols; j++) {
                var tile = tiles.pop();
                grids += newGrid(tile.shape, tile.color);
            }
            grids += '</div>';
        }
        BOARD.innerHTML = grids;
    }

    function initGame() {
        var config = getLevelConfig(level);
        rows = config[0];
        cols = config[1];
        count = rows * cols;
        match = [];
        incrementTime(config[2]);
        setText('level', level);
        setBoard(config[3]);
    }

    function newTimer() {
        timer = window.setInterval(function() {
            setText('timer', --time);
            if (time === 0) endGame();
        }, 1000);
    }

    function endTimer() {
        window.clearInterval(timer);
    }

    function newGame() {
        if (!inPlay) {
            inPlay = true;
            time = 0;
            level = 0;
            initGame();
        } else {
            endTimer();
            level += 1;
            window.setTimeout(function(){
                initGame();
                newTimer();
            }, 1000);
        }
    }

    function endGame() {
        endTimer();
        inPlay = false;
        setText('timer', "Game Over");
    }

    // start game
    var BOARD = document.getElementById('board');
    var SHAPES = ['square', 'circle', 'triangle', 'heart'];
    var rows, cols, count, match, level, time, timer;
    var inPlay = false;

    BOARD.addEventListener("click", function(){
        validate(event, clickTile)
    }, false);

    document.getElementById('start').addEventListener("click", function(){
        newTimer();
        document.getElementById('popup').classList.add('hidden');
    }, false);

    newGame();
};
