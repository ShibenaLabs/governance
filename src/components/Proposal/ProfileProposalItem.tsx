import React from 'react'

import useFormatMessage from 'decentraland-gatsby/dist/hooks/useFormatMessage'
import { Link } from 'decentraland-gatsby/dist/plugins/intl'
import Time from 'decentraland-gatsby/dist/utils/date/Time'
import { Card } from 'decentraland-ui/dist/components/Card/Card'
import { Header } from 'decentraland-ui/dist/components/Header/Header'
import { Mobile, NotMobile } from 'decentraland-ui/dist/components/Media/Media'

import { VotedProposal } from '../../entities/Votes/types'
import locations from '../../modules/locations'
import CategoryPill from '../Category/CategoryPill'
import ChevronRightCircleOutline from '../Icon/ChevronRightCircleOutline'
import StatusPill from '../Status/StatusPill'

import './ProfileProposalItem.css'
import ResultStance from './ResultStance'

interface Props {
  votedProposal: VotedProposal
}

function ProfileProposalItem({ votedProposal }: Props) {
  const t = useFormatMessage()
  const { proposal } = votedProposal
  const choiceIdx = votedProposal.choice - 1
  const { choices, finish_at, scores } = proposal
  const dateText = t(`page.home.open_proposals.${Time().isBefore(Time(finish_at)) ? 'ends_date' : 'ended_date'}`, {
    value: Time(finish_at).fromNow(),
  })
  const maxScore = Math.max(...scores)
  const winningChoice = scores.indexOf(maxScore)

  const isMatch = winningChoice === choiceIdx

  return (
    <Card as={Link} href={locations.proposal(proposal.proposal_id)} className="ProfileProposalItem">
      <Card.Content>
        <div>
          <div className="ProfileProposalItem__Title">
            <Header>{proposal.title}</Header>
          </div>
          <Mobile>
            <div>
              <ResultStance isMatch={isMatch} />
            </div>
          </Mobile>
          <div className="ProfileProposalItem__Status">
            <div className="ProfileProposalItem__Details">
              <StatusPill status={proposal.status} />
              {proposal.type && <CategoryPill type={proposal.type} />}
              <NotMobile>
                <Header sub>
                  <span>{t('page.profile.voted_proposals.vote', { vote: choices[choiceIdx] })}</span> · {dateText}
                </Header>
              </NotMobile>
            </div>
          </div>
        </div>
        <div>
          <NotMobile>
            <ResultStance isMatch={isMatch} />
          </NotMobile>
        </div>
        <div>
          <ChevronRightCircleOutline />
        </div>
      </Card.Content>
    </Card>
  )
}

export default ProfileProposalItem