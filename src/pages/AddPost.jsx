import React from 'react'
import { Container, PostForm } from '../components'


const AddPost = () => {
  return (
    <div className='pt-32 pb-16 min-h-screen bg-background dark:bg-background'>
      <Container>
        <PostForm />
      </Container>
    </div>
  )
}

export default AddPost
