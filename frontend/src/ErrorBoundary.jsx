import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('App crashed:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding:40,textAlign:'center',fontFamily:'sans-serif'}}>
          <div style={{fontSize:40,marginBottom:16}}>⚠️</div>
          <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>App bị lỗi</div>
          <div style={{fontSize:12,color:'#666',marginBottom:20,wordBreak:'break-all'}}>
            {this.state.error?.message}
          </div>
          <button onClick={()=>window.location.reload()}
            style={{padding:'10px 24px',background:'#2e7d32',color:'#fff',border:'none',borderRadius:8,fontSize:14}}>
            Tải lại
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
