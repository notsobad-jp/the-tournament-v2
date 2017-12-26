<teams>
  <div class="required field">
    <div class="ui tiny header">参加者の登録</div>

    <div class="ui icon mini primary buttons">
      <div class="ui icon button { disabled: Object.keys(tournament.teams).length >= 128 }" onclick={ addRound }>
        <i class="icon plus"></i>
      </div>
      <div class="ui icon button { disabled: Object.keys(tournament.teams).length <= 4 }" onclick={ removeRound }>
        <i class="icon minus"></i>
      </div>
    </div>
    <small>
      参加者数
      <span class="ui circular mini label">{ Object.keys(tournament.teams).length }</span>
    </small>
    <br><br>

    <div class="ui secondary pointing fluid two item pink small tabular menu">
      <a class="active item" data-tab="textInput">
        通常設定
      </a>
      <a class="item" data-tab="detailInput">
        詳細設定
      </a>
    </div>

    <div class="ui active tab" data-tab="textInput">
      <textarea name="teams" onchange={ updateTeams } style="line-height:22px; height:{ calcTextareaHeight() }px; max-height:256em;">{ teamText() }</textarea>
    </div>

    <div class="ui tab" data-tab="detailInput">
      <div class="ui segments">
        <div class="ui clearing segment" each={ team, teamIndex in tournament.teams }>
          <i class="flag { team.country }" if={ team.country }></i>
          { team.name || '--' }
          <span if={ team.group }>（{ team.group }）</span>
          <a href={ team.url } target="_blank" if={ team.url && team.url != '' }>
            <i class="icon external"></i>
          </a>

          <button class="ui mini primary right floated icon button" data-teamid={ teamIndex } onclick={ showTeamModal }>
            <i class="icon setting"></i>
          </button>
        </div>
      </div>
    </div>
  </div>


  <style>
    small { margin-left: 10px; }
  </style>


  <script>
    /***********************************************
    * Variables
    ***********************************************/
    var that = this
    that.tournament = opts.tournament
    that.mixin('tournamentMixin')


    /***********************************************
    * Observables
    ***********************************************/


    /***********************************************
    * Functions
    ***********************************************/
    /* 通常設定 */
    updateTeams(e) {
      teams = e.target.value.trim().split('\n')

      var oldTeamCount = Object.keys(that.tournament.teams).length
      var oldRoundCount = Math.ceil(Math.log10(oldTeamCount) /Math.log10(2))

      var newRoundCount = Math.ceil(Math.log10(teams.length) / Math.log10(2))
      var newTeamCount = Math.pow(2, newRoundCount)

      var roundCountDiff = newRoundCount - oldRoundCount
      if(roundCountDiff > 0) {
        that.addTeams(that.tournament, roundCountDiff, false)
      }else if(roundCountDiff < 0) {
        that.removeTeams(that.tournament, Math.abs(roundCountDiff))
      }

      for(var i=0; i<newTeamCount; i++) {
        that.tournament.teams[i]['name'] = teams[i] || ''
      }
      that.updateByeGames(that.tournament)

      obs.trigger("tournamentChanged", that.tournament)
    }

    teamText() {
      text = ''
      for( key in that.tournament.teams ) {
        text += that.tournament.teams[key]['name'] + '\n'
      }
      return text
    }

    calcTextareaHeight() {
      var teamsCount = Object.keys(that.tournament.teams).length
      var lineHeight = 22
      return teamsCount * lineHeight + 70
    }


    /* 詳細設定 */
    updateTeam(e) {
      var teamIndex = Number(e.currentTarget.getAttribute('data-teamid'))
      var attribute = e.currentTarget.getAttribute('name')
      that.tournament.teams[teamIndex][attribute] = e.currentTarget.value

      if(attribute=='name') {
        that.tournament = that.updateByeGames(that.tournament)
      }
      obs.trigger("tournamentChanged", that.tournament)
    }

    selectCountry(e) {
      var countrySelect = that.refs.country_select
      var teamIndex = e.currentTarget.getAttribute('data-teamid')
      countrySelect.showModal(teamIndex)
    }

    addRound() {
      that.addTeams(that.tournament, 1, true)
      obs.trigger("tournamentChanged", that.tournament)
    }
    removeRound() {
      that.removeTeams(that.tournament, 1, true)
      obs.trigger("tournamentChanged", that.tournament)
    }

    showTeamModal(e) {
      e.preventDefault()
      var teamIndex = e.currentTarget.getAttribute('data-teamid')
      obs.trigger("teamModalChanged", teamIndex)
    }

    $(function(){
      $('.tabular.menu .item').tab()
    })
  </script>
</teams>
