(function(box, $, undefined) {
    
    var letterWidth = 10;
    
    box.templates = {
        linenum: function(num) {
            return '<span class="linenum editing" id="num-{{num}}">{{num}}</span>'.replace(/\{\{num\}\}/g, num);
        },
        line: function(id) {
            return '<span class="line editing" id="line-{{id}}"></span>'.replace('{{id}}', id);
        },
        code: function(type) {
            return '<span class="code {{type}} editing"></span>'.replace('{{type}}', type)  ;
        },
        cursor: function() {
            return '<span class="cursor"></span>';
        }
    }
    
    function Line(num) {
        this.num = num || 0;
        this.elem = '#line-'+this.num;
        this.next = function() {
            this.num++;
            this.elem = '#line-'+this.num;
            return this;
        }
    }
    function Random(max, min) {
        if (max < min) {
            var t = min;
            min = max;
            max = t;
        }
        var max = max || 10;
        var min = min || 1;
        return Math.floor(Math.random() * (max - min) + min);
    }
    function RandomDelay(max, min) {
        var max = max || 1000;
        var min = min || 100;
        if (Random() > 3) {
            return Random(max, min);
        }
        return min;
    }
    
    box.currentLine = new Line();
    box.prev = null;
    box.depth = 0;
    box.maxLines = Math.ceil($(window).height() / 18);
    $(document).on('resize', function() {box.maxLines = Math.ceil($(window).height() / 18);});

    box.init = function() {

        if (detectIE() != false) {
            $('html,body,.lines,.textarea').css('height', '100%');
        }

        box.writeCommentBlock(false);
        //box.choose();
    }
    box.newLine = function() {
        $('.cursor').remove();
        $('#line-'+box.currentLine.num+', #num-'+box.currentLine.num).removeClass('editing');
        box.currentLine = box.currentLine.next();
        $('.lines').append(box.templates.linenum(box.currentLine.num));
        $('.textarea').append(box.templates.line(box.currentLine.num));
        $(box.currentLine.elem).append(box.templates.cursor());
        var num = box.currentLine.num - (box.maxLines + 4);
        if (num > 0) {
            $('#line-'+num+', #num-'+num).remove();
        }
        $('body').animate({
            scrollTop: $('body').prop('scrollHeight'),
        }, {
            duration: 1000
        });
    }
    box.choose = function(exclude) {
        if (box.depth > 15)
            return box.closeBlock;
        if (!exclude || exclude == '' || box.depth == 0) {
            return box.writeFunction;
        }
        if (exclude == '!function') {
            var R = Random(330);
        } else if (exclude == '!comment') {
            var R = Random(300);
        }
        if (R > 280)
            return box.writeComment;
        if (R < 30)
            return box.writeCommentBlock;
        else if (R <= 100)
            return box.writeIf;
        else if (R <= 190)
            return box.writeVar;
        else {
            if (box.prev == 'function' || box.prev == 'if')
                return box.choose(exclude);
            else
                return box.closeBlock;
        }
    }
    box.write = function(type) {
        box.finishSection();
        $(box.templates.code(type)).insertBefore('.cursor');
    }
    box.writeCommentBlock = function(nonew) {
        //box.prev = 'comment';
        var q = new Queue(function() {
            box.newLine();
            var r = box.choose('!comment');
            r();
        }, 3000);
        var min = min || 1;
        var max = max || 8;
        var lines = Random(max, min);
        if (!!nonew) {
            q.add(function() {
                box.newLine();
                q.run();
            });
        }
        for (var i = 0; i < lines; i++) {
                q.add(function() {
                box.newLine();
                box.writeTab(box.depth);
                box.write('comment');
                box.setLength(Random(40, 20), function() {
                    q.run();
                });
            });
        }
        q.run();
    }
    box.writeComment = function() {
        box.writeSpace();
        box.write('comment');
        box.setLength(Random(30, 10), function() {
            var r = box.choose('!comment');
            r();
        });  
    }
    box.writeFunction = function() {
        box.prev = 'function';
        /*var remaining = remainingLevels || 1;
        var depth = curDepth || 0;*/
        box.newLine();
        box.writeTab(box.depth);
        var q = new Queue(function() {
            //box.writeFunction(++depth, --remaining);
            //box.choose('!function');
            box.writeFunction();
        });
        q.add(function() {
            box.write('type');
            box.setLength(3, function() {
                box.writeSpace();
                q.run();
            });
            });
        q.add(function() {
            box.write('function');
            box.setLength(Random(20, 5), function() {
                box.writeSpace();
                q.run();
            });
        });
        q.add(function() {
            box.write('operator');
            box.setLength(1, function() {
                box.writeSpace();
                q.run();
            });
        })
        q.add(function() {
            box.write('type');
            box.setLength(8, function() {
                q.run();
            });
        });
        q.add(function() {
            box.write('dot');
            box.setLength(1, function() {
               q.run(); 
            });
        });
        q.add(function() {
            box.writeParams(function() {
                q.run();
            });
        });
        q.add(function() {
            box.write('dot');
            box.setLength(1, function() {
               q.run(); 
            });
        });
        q.add(function() {
            box.writeSpace();
            box.write('dot');
            box.setLength(1, function() {
               q.run(); 
            });
        });
        q.add(function() {
            box.depth++;
            var r = box.choose('!function');
            r(function() {
                q.run();
            });
        });
        q.run();
    }
    box.writeParams = function(onFinish) {
        var numParams = Random(5, 0);
        var q = new Queue(onFinish);
        for (var i = 0; i < numParams - 1; i++) {
            q.add(function() {
                box.write('variable');
                box.setLength(Random(10, 1), function() {
                    box.write('dot');
                    box.writeSpace();
                    q.run();
                });
            });
        }
        q.add(function() {
            box.write('variable');
            box.setLength(Random(10, 1), function() {
                q.run();
            });
        });
        q.run();
    }
    box.writeVar = function(done) {
        box.prev = 'var';
        var done = done;
        var num = Random(5, 1);
        var q = new Queue(function() {
            var r = box.choose('!function');
            r(done);
        });
        for (var i = 0; i < num; i++) {
            q.add(function() {
                box.newLine();
                box.writeTab(box.depth);
                box.write('type');
                box.setLength(3, function() {
                    box.writeSpace();
                    q.run();
                });
            });
            q.add(function() {
                box.write('variable');
                box.setLength(Random(10, 1), function() {
                    box.writeSpace();
                    q.run();
                });
            });
            q.add(function() {
                box.write('operator');
                box.setLength(1, function() {
                    box.writeSpace();
                    q.run();
                });
            });
            var rand = Random(5,1);
            switch(rand) {
                case 1:
                    q.add(function() {
                        box.write('dot');
                        box.setLength(2, function() {
                            q.run();
                        });
                    });
                    break;
                case 2:
                    q.add(function() {
                        box.write('number');
                        box.setLength(Random(5, 1), function() {
                            q.run();
                        });
                    });
                    break;
                case 3:
                    q.add(function() {
                        box.write('variable');
                        box.setLength(Random(8, 4), function() {
                            q.run();
                        });
                    });
                    break;
                case 4:
                    q.add(function() {
                        box.write('string');
                        box.setLength(Random(20, 4), function() {
                            q.run();
                        });
                    });
                    break;
            }
            q.add(function() {
                box.write('dot');
                box.setLength(1, function() {
                    q.run();
                });
            });
        }
        q.run();
    }
    box.writeIf = function(done) {
        box.prev = 'if';
        var depth = depth || Random(5);
        var done = done;
        var q = new Queue(function() {
            var r = box.choose('!function');
            r(done);
        });
        box.newLine();
        box.writeTab(box.depth);
        q.add(function() {
            box.write('operator');
            box.setLength(2, function() {
                box.writeSpace();
                q.run();
            });
        });
        q.add(function() {
            box.write('dot');
            box.setLength(1, function() {
                q.run();
            });
        });
        q.add(function() {
            box.write('variable');
            box.setLength(Random(10, 4), function() {
                q.run();
            });
        });
        if (Random(1, 0) == 1) {
            q.add(function() {
                box.writeSpace();
                box.write('operator');
                box.setLength(2, function() {
                    box.writeSpace();
                    q.run();
                });
            });
            var rand = Random(4,1);
            switch(rand) {
                case 1:
                    q.add(function() {
                        box.write('number');
                        box.setLength(Random(5, 1), function() {
                            q.run();
                        });
                    });
                    break;
                case 2:
                    q.add(function() {
                        box.write('variable');
                        box.setLength(Random(8, 4), function() {
                            q.run();
                        });
                    });
                    break;
                case 3:
                    q.add(function() {
                        box.write('string');
                        box.setLength(Random(15, 4), function() {
                            q.run();
                        });
                    });
                    break;
            }
        }
        q.add(function() {
            box.write('dot');
            box.setLength(1, function() {
                box.writeSpace();
                q.run();
            });
        });
        q.add(function() {
            box.write('dot');
            box.setLength(1, function() {
                box.depth++;
                var r = box.choose('!function');
                r(function() {
                    q.run();
                });
            });
        });
        q.run();
    }
    box.closeBlock = function(done) {
        box.prev = 'close';
        var done = done;
        var max = box.depth;
        var q = new Queue(function() {
            if (box.depth == 0) {
                box.writeFunction();
            } else {
                done();
            }
        });
        for (var i = 0; i < Random(max + 1, 1) - 1; i++) {
            q.add(function() {
                box.depth--;
                box.newLine();
                box.writeTab(box.depth);
                box.write('dot');
                box.setLength(1, function() {
                    q.run();
                });
            });
        }
        q.add(function() {
            box.depth--;
            box.newLine();
            box.writeTab(box.depth);
            box.write('dot');
            box.setLength(1, function() {
                var r = box.choose('!function');
                r(function() {
                    q.run();
                });
            });
        });
        q.run();
    }
    box.writeSpace = function(num) {
        var n = num || 1;
        for (var i = 0; i < n; i++) {
            box.write('space');
        }
    }
    box.writeTab = function(num) {
        var n = num || 0;
        for (var i = 0; i < n; i++) {
            box.write('tab');
        }
    }
    box.setLength = function(len, onFinish) {
        $('.cursor').addClass('moving');
        $('.code.editing').css({
            'border-radius': '3px 8px 8px 3px'
        })
        $('.code.editing').animate({
            width: len * letterWidth
        }, {
            duration: len * letterWidth * 4,
            //duration: (len * letterWidth * 4) > 2000 ? (len * letterWidth * 4) : 2000,
            easing: 'linear',
            complete: function() {
                $('.code.editing').css({
                    'border-radius': '3px'
                }).removeClass('editing');
                $('.cursor').removeClass('moving');
                onFinish();
            }
        });
    }
    box.finishSection = function() {
        $('.code.editing').removeClass('editing');
    }
    function Queue(onFinish, delay) {
        var queue = [];
        var onFinish = onFinish;
        var del = delay || 0;
        this.add = function(fn) {
            queue.push(fn);
        }
        var next = function() {
            var fn = queue.shift();
            fn();
        }
        var empty = function() {
            return queue.length == 0;
        }
        this.run = function () {
            setTimeout(function() {
                if (!empty()) {
                    next();
                } else {
                    onFinish();
                }  
            }, RandomDelay(del));
        }
    }

})(window.box = window.box || {}, jQuery);

function detectIE() {
  var ua = window.navigator.userAgent;

  var msie = ua.indexOf('MSIE ');
  if (msie > 0) {
    // IE 10 or older => return version number
    return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
  }

  var trident = ua.indexOf('Trident/');
  if (trident > 0) {
    // IE 11 => return version number
    var rv = ua.indexOf('rv:');
    return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
  }

  var edge = ua.indexOf('Edge/');
  if (edge > 0) {
    // Edge (IE 12+) => return version number
    return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
  }

  // other browser
  return false;
}