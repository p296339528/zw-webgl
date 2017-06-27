/*
* jQuery pager plugin
* Version 1.0 (12/22/2008)
* @requires jQuery v1.2.6 or later
* Download by http://www.codefans.net
* Example at: http://jonpauldavies.github.com/JQuery/Pager/PagerDemo.html
*
* Copyright (c) 2008-2009 Jon Paul Davies
* Dual licensed under the MIT and GPL licenses:
* http://www.opensource.org/licenses/mit-license.php
* http://www.gnu.org/licenses/gpl.html
* 
* Read the related blog post and contact the author at http://www.j-dee.com/2008/12/22/jquery-pager-plugin/
*
* This version is far from perfect and doesn't manage it's own state, therefore contributions are more than welcome!
*
* Usage: .pager({ pagenumber: 1, pagecount: 15, buttonClickCallback: PagerClickTest });
*
* Where pagenumber is the visible page number
*       pagecount is the total number of pages to display
*       buttonClickCallback is the method to fire when a pager button is clicked.
*
* buttonClickCallback signiture is PagerClickTest = function(pageclickednumber) 
* Where pageclickednumber is the number of the page clicked in the control.
*
* The included Pager.CSS file is a dependancy but can obviously tweaked to your wishes
* Tested in IE6 IE7 Firefox & Safari. Any browser strangeness, please report.
*/
(function ($) {

    $.fn.pager = function (options) {

        var opts = $.extend({}, $.fn.pager.defaults, options);


        //绑定KeyUp事件，验证非正整数
        $("#"+opts.id+" + div .pgTxt").live("keyup", function () {
            var pattern = /^[1-9]\d*$/;
            var toPage = $("#"+opts.id+" + div .pgTxt").val();
            toPage = toPage.replace(/[^\d]/g, "");
            if (!pattern.test(toPage)) {
                $("#"+opts.id+" + div .pgTxt").val("");
            } else {
                $("#"+opts.id+" + div .pgTxt").val(toPage);
            }
        });

        //绑定click跳转事件
        $("#"+opts.id+" + div .pgGoTo").die().live("click", function () {
            var destPage = 1;
            destPage = parseInt($("#"+opts.id+" + div .pgTxt").val());
            if (destPage > opts.pagecount) {
                destPage = opts.pagecount;
            }
            opts.pagenumber=destPage;
            options.buttonClickCallback(opts);
        });

        return this.each(function () {

            // empty out the destination element and then render out the pager with the supplied options
            $(this).empty().append(renderpager(parseInt(options.pagenumber), parseInt(options.pagecount), parseInt(opts.totalcount), options.buttonClickCallback,options));

            // specify correct cursor activity
            $('.pages li').mouseover(function () { document.body.style.cursor = "pointer"; }).mouseout(function () { document.body.style.cursor = "auto"; });
        });
    };

    // render and return the pager with the supplied options
    function renderpager(pagenumber, pagecount, totalcount, buttonClickCallback,options) {

        // setup $pager to hold render
        var $pager = $('<ul class="pages"></ul>');

        // add in the previous and next buttons
        $pager.append(renderButton('<<', pagenumber, pagecount, buttonClickCallback,options)).append(renderButton('<', pagenumber, pagecount, buttonClickCallback,options));

        // pager currently only handles 10 viewable pages ( could be easily parameterized, maybe in next version ) so handle edge cases
        var startPoint = 1;
        var endPoint = 5;

        if (pagenumber > 4) {
            startPoint = pagenumber - 2;
            endPoint = pagenumber + 2;
        }

        if (endPoint > pagecount) {
            startPoint = pagecount - 5;
            endPoint = pagecount;
        }

        if (startPoint < 1) {
            startPoint = 1;
        }
        // loop thru visible pages and render buttons
        for (var page = startPoint; page <= endPoint; page++) {

            var currentButton = $('<li class="page-number">' + (page) + '</li>');

            page == pagenumber ? currentButton.addClass('pgCurrent') : currentButton.click(function() {
                options.pagenumber=this.firstChild.data;
                buttonClickCallback(options);
            });
            currentButton.appendTo($pager);
        }

        // render in the next and last buttons before returning the whole rendered control back.
        $pager.append(renderButton('>', pagenumber, pagecount, buttonClickCallback,options)).append(renderButton('>>', pagenumber, pagecount, buttonClickCallback,options));
        $pager.append("<input id='txtToPage' class='pgTxt'  />");
        $pager.append("<span id='btnPagerGo' class='pgGoTo'>go</span>");

        return $pager;
    }

    // renders and returns a 'specialized' button, ie 'next', 'previous' etc. rather than a page number button
    function renderButton(buttonLabel, pagenumber, pagecount, buttonClickCallback,options) {

        var $Button = $('<li class="pgNext">' + buttonLabel + '</li>');

        var destPage = 1;

        // work out destination page for required button type
        switch (buttonLabel) {
            case "<<":
                destPage = 1;
                break;
            case "<":
                destPage = pagenumber - 1;
                break;
            case ">":
                destPage = pagenumber + 1;
                break;
            case ">>":
                destPage = pagecount;
                break;
        }
            // options.pagenumber=destPage;
        // disable and 'grey' out buttons if not needed.
        if (buttonLabel == "<<" || buttonLabel == "<") {

            pagenumber <= 1 ? $Button.addClass('pgEmpty') : $Button.click(function() {
                options.pagenumber=destPage;
                buttonClickCallback(options);
            });
        }
        else {
            pagenumber >= pagecount ? $Button.addClass('pgEmpty') : $Button.click(function() {
               options.pagenumber=destPage;
                buttonClickCallback(options);
            });
        }

        return $Button;
    }

    // pager defaults. hardly worth bothering with in this case but used as placeholder for expansion in the next version
    $.fn.pager.defaults = {
        pagenumber: 1,
        pagecount: 1
    };

})(jQuery);