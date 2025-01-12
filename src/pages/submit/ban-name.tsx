import React, { useEffect, useRef, useState } from 'react'
import Helmet from 'react-helmet'

import Label from 'decentraland-gatsby/dist/components/Form/Label'
import MarkdownTextarea from 'decentraland-gatsby/dist/components/Form/MarkdownTextarea'
import Head from 'decentraland-gatsby/dist/components/Head/Head'
import Paragraph from 'decentraland-gatsby/dist/components/Text/Paragraph'
import useAuthContext from 'decentraland-gatsby/dist/context/Auth/useAuthContext'
import useEditor, { assert, createValidator } from 'decentraland-gatsby/dist/hooks/useEditor'
import useFormatMessage from 'decentraland-gatsby/dist/hooks/useFormatMessage'
import { navigate } from 'decentraland-gatsby/dist/plugins/intl'
import Catalyst from 'decentraland-gatsby/dist/utils/api/Catalyst'
import { Button } from 'decentraland-ui/dist/components/Button/Button'
import { Field } from 'decentraland-ui/dist/components/Field/Field'
import { Header } from 'decentraland-ui/dist/components/Header/Header'

import { Governance } from '../../clients/Governance'
import ErrorMessage from '../../components/Error/ErrorMessage'
import MarkdownNotice from '../../components/Form/MarkdownNotice'
import ContentLayout, { ContentSection } from '../../components/Layout/ContentLayout'
import LoadingView from '../../components/Layout/LoadingView'
import CoAuthors from '../../components/Proposal/Submit/CoAuthor/CoAuthors'
import LogIn from '../../components/User/LogIn'
import { newProposalBanNameScheme } from '../../entities/Proposal/types'
import { isValidName, userModifiedForm } from '../../entities/Proposal/utils'
import loader from '../../modules/loader'
import locations from '../../modules/locations'

import './submit.css'

type BanNameState = {
  name: string
  description: string
  coAuthors?: string[]
}

const initialState: BanNameState = {
  name: '',
  description: '',
}

const schema = newProposalBanNameScheme.properties

const edit = (state: BanNameState, props: Partial<BanNameState>) => {
  return {
    ...state,
    ...props,
  }
}

const validate = createValidator<BanNameState>({
  name: (state) => ({
    name:
      (state.name.length >= 2 && assert(isValidName(state.name), 'error.ban_name.name_invalid')) ||
      assert(state.name.length <= schema.name.maxLength, 'error.ban_name.name_too_large'),
  }),
  description: (state) => ({
    description: assert(
      state.description.length <= schema.description.maxLength,
      'error.ban_name.description_too_large'
    ),
  }),
  '*': (state) => ({
    name:
      assert(state.name.length > 0, 'error.ban_name.name_empty') ||
      assert(state.name.length >= schema.name.minLength, 'error.ban_name.name_too_short') ||
      assert(isValidName(state.name), 'error.ban_name.name_invalid') ||
      assert(state.name.length <= schema.name.maxLength, 'error.ban_name.name_too_large'),
    description:
      assert(state.description.length > 0, 'error.ban_name.description_empty') ||
      assert(state.description.length >= schema.description.minLength, 'error.ban_name.description_too_short') ||
      assert(state.description.length <= schema.description.maxLength, 'error.ban_name.description_too_large'),
  }),
})

export default function SubmitBanName() {
  const t = useFormatMessage()
  const [account, accountState] = useAuthContext()
  const [state, editor] = useEditor(edit, validate, initialState)
  const [formDisabled, setFormDisabled] = useState(false)
  const preventNavigation = useRef(false)

  const setCoAuthors = (addresses?: string[]) => editor.set({ coAuthors: addresses })

  useEffect(() => {
    preventNavigation.current = userModifiedForm(state.value, initialState)

    if (state.validated) {
      setFormDisabled(true)
      Promise.resolve()
        .then(async () => {
          let names: string[]
          try {
            names = await Catalyst.get().getBanNames()
          } catch (err) {
            console.log(err)
            throw new Error('error.ban_name.fetching_names')
          }

          if (names.includes(state.value.name.toLowerCase())) {
            throw new Error('error.ban_name.name_already_banned')
          }

          return Governance.get().createProposalBanName(state.value)
        })
        .then((proposal) => {
          loader.proposals.set(proposal.id, proposal)
          navigate(locations.proposal(proposal.id, { new: 'true' }), { replace: true })
        })
        .catch((err) => {
          console.error(err, { ...err })
          editor.error({ '*': err.body?.error || err.message })
          setFormDisabled(false)
        })
    }
  }, [editor, state.validated, state.value])

  if (accountState.loading) {
    return <LoadingView />
  }

  if (!account) {
    return (
      <LogIn title={t('page.submit_ban_name.title') || ''} description={t('page.submit_ban_name.description') || ''} />
    )
  }

  return (
    <ContentLayout small preventNavigation={preventNavigation.current}>
      <Head
        title={t('page.submit_ban_name.title') || ''}
        description={t('page.submit_ban_name.description') || ''}
        image="https://decentraland.org/images/decentraland.png"
      />
      <Helmet title={t('page.submit_ban_name.title') || ''} />
      <ContentSection>
        <Header size="huge">{t('page.submit_ban_name.title')}</Header>
      </ContentSection>
      <ContentSection>
        <Paragraph small>{t('page.submit_ban_name.description')}</Paragraph>
      </ContentSection>
      <ContentSection>
        <Label>{t('page.submit_ban_name.name_label')}</Label>
        <Field
          value={state.value.name}
          onChange={(_, { value }) => editor.set({ name: value })}
          onBlur={() => editor.set({ name: state.value.name.trim() })}
          error={!!state.error.name}
          message={
            t(state.error.name) +
            ' ' +
            t('page.submit.character_counter', {
              current: state.value.name.length,
              limit: schema.name.maxLength,
            })
          }
          disabled={formDisabled}
        />
      </ContentSection>
      <ContentSection>
        <Label>
          {t('page.submit_ban_name.description_label')}
          <MarkdownNotice />
        </Label>
        <Paragraph tiny secondary className="details">
          {t('page.submit_ban_name.description_detail')}
        </Paragraph>
        <MarkdownTextarea
          minHeight={175}
          value={state.value.description}
          onChange={(_: unknown, { value }: { value: string }) => editor.set({ description: value })}
          onBlur={() => editor.set({ description: state.value.description.trim() })}
          error={!!state.error.description}
          message={
            t(state.error.description) +
            ' ' +
            t('page.submit.character_counter', {
              current: state.value.description.length,
              limit: schema.description.maxLength,
            })
          }
          disabled={formDisabled}
        />
      </ContentSection>
      <ContentSection>
        <CoAuthors setCoAuthors={setCoAuthors} isDisabled={formDisabled} />
      </ContentSection>
      <ContentSection>
        <Button primary disabled={state.validated} loading={state.validated} onClick={() => editor.validate()}>
          {t('page.submit.button_submit')}
        </Button>
      </ContentSection>
      {state.error['*'] && (
        <ContentSection>
          <ErrorMessage label={t('page.submit.error_label')} errorMessage={t(state.error['*']) || state.error['*']} />
        </ContentSection>
      )}
    </ContentLayout>
  )
}
